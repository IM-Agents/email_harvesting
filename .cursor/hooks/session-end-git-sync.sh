#!/usr/bin/env bash
# On session end / agent stop: refresh indexes, commit remaining files, push if ahead.
# Fire-and-forget. Set CURSOR_HOOK_SKIP_SESSION_PUSH=1 to disable.
set -uo pipefail

export PATH="${HOME}/.local/bin:${HOME}/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=session-end-common.sh
source "${SCRIPT_DIR}/session-end-common.sh"
# shellcheck source=crg-common.sh
source "${SCRIPT_DIR}/crg-common.sh"
# shellcheck source=mcp-index-common.sh
source "${SCRIPT_DIR}/mcp-index-common.sh"

call_clickup_on_push_success() {
  local task_id=""
  local api_key=""
  local project_name=""
  local project_response=""
  local user_id=""
  local comment_payload=""
  local clickup_http=""
  local resp_snippet=""
  local public_url=""

  task_id="$(session_clickup_task_id "$ROOT")"
  if [[ -z "$task_id" ]]; then
    session_trace "taskId not found (process.md **clickup_task** or CLICKUP_TASK_ID), skipping ClickUp"
    return 0
  fi

  api_key="${CLICKUP_API_KEY:-${CLICKUP_API_TOKEN:-}}"

  if [[ -z "$api_key" ]]; then
    session_trace "CLICKUP_API_KEY/CLICKUP_API_TOKEN not set, skipping ClickUp notification"
    return 0
  fi

  project_name="$(basename "$ROOT")"
  user_id="${CLICKUP_USER_ID:-${CLICKUP_AGENT_USER_ID:-}}"

  session_trace "Triggering project run for ${project_name} (taskId=${task_id})"

  project_response="$(curl -s -S -m 120 -X POST "http://localhost:4001/api/agents/projects/run" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${project_name}\", \"taskId\": \"${task_id}\"}" 2>&1 || true)"

  if [[ -z "$project_response" ]]; then
    session_trace "Failed to trigger project run (empty response)"
    return 0
  fi

  public_url="$(session_project_url_from_response "$project_response")"
  if [[ -z "$public_url" ]]; then
    resp_snippet="$(printf '%s' "$project_response" | head -c 240 | tr '\n' ' ')"
    session_trace "No project URL in response, skipping ClickUp (${resp_snippet})"
    return 0
  fi

  session_trace "Frontend URL for ClickUp: ${public_url}, posting comment for taskId=${task_id}"

  if [[ -z "$user_id" ]]; then
    session_trace "CLICKUP_USER_ID not set — cannot @IM_Agent tag; skipping ClickUp notification"
    return 0
  fi

  # ClickUp renders: @IM_Agent Role: Project Run Completed and Started QA Work + Frontend URL
  comment_payload=$(cat <<EOF
{
  "notify_all": false,
  "comment": [
    {
      "type": "tag",
      "user": {
        "id": ${user_id}
      }
    },
    {
      "text": " Role: Project Run Completed and Started QA Work\n\nFrontend URL: ${public_url}"
    }
  ]
}
EOF
)

  clickup_http="$(curl -s -S -o /tmp/clickup-comment-body.json -w "%{http_code}" -X POST \
    "https://api.clickup.com/api/v2/task/${task_id}/comment" \
    -H "Content-Type: application/json" \
    -H "Authorization: ${api_key}" \
    -d "$comment_payload" 2>/dev/null || echo "000")"

  if [[ "$clickup_http" == "200" || "$clickup_http" == "201" ]]; then
    MSG_PARTS+=("clickup:comment-sent")
    session_trace "ClickUp comment posted @IM_Agent format (HTTP ${clickup_http})"
  else
    session_trace "ClickUp comment failed (HTTP ${clickup_http}) $(head -c 160 /tmp/clickup-comment-body.json 2>/dev/null | tr '\n' ' ')"
  fi

  session_trace "Updating ClickUp task status to 'Review / Dev. Testing'"
  if curl -s -S -o /dev/null -w "%{http_code}" -X PUT "https://api.clickup.com/api/v2/task/${task_id}" \
    -H "Content-Type: application/json" \
    -H "Authorization: ${api_key}" \
    -d '{"status":"Review / Dev. Testing"}' 2>/dev/null | grep -qE '^(200|204)$'; then
    MSG_PARTS+=("clickup:status-updated")
  else
    session_trace "ClickUp status update failed"
  fi
}

session_consume_stdin
session_trace "hook start pwd=${PWD} script=${SCRIPT_DIR}"

if [[ -n "$SESSION_END_SKIP" ]]; then
  session_emit_json "session-end-git: skipped (CURSOR_HOOK_SKIP_SESSION_PUSH)"
  exit 0
fi

if ! session_should_run_debounced; then
  session_emit_json "session-end-git: debounced"
  exit 0
fi

ROOT="$(session_resolve_repo_root "$SCRIPT_DIR")"
SESSION_REPO_ROOT="$ROOT"
session_trace "repo_root=${ROOT:-none}"

if [[ -z "$ROOT" || ! -d "${ROOT}/.git" ]]; then
  session_emit_json "session-end-git: not a git repository (pwd=${PWD})"
  exit 0
fi

MSG_PARTS=()
AUTOMATION_ONLY=false

# Check if all committed changes are inside the "automation" folder.
# When true, we push but skip the ClickUp comment and run-project API call.
session_is_automation_only_change() {
  local root="$1"
  local files non_auto
  files="$(cd "$root" && git diff --cached --name-only 2>/dev/null || true)"
  if [[ -z "$files" ]]; then
    # Nothing staged — fall back to last commit diff
    files="$(cd "$root" && git diff --name-only HEAD~1..HEAD 2>/dev/null || true)"
  fi
  [[ -z "$files" ]] && return 1
  non_auto="$(printf '%s\n' "$files" | grep -v '^automation/' || true)"
  [[ -z "$non_auto" ]]
}

if command -v code-review-graph >/dev/null 2>&1 && declare -f crg_run_in_repo >/dev/null 2>&1; then
  crg_run_in_repo code-review-graph update --skip-flows >/dev/null 2>&1 || true
  MSG_PARTS+=("crg:updated")
fi

if declare -f mcp_verify_tools >/dev/null 2>&1 && mcp_verify_tools; then
  mcp_run_sync false >/dev/null 2>&1 || true
  MSG_PARTS+=("mcp-index:synced")
fi

COMMITTED=false

if session_has_worktree_changes "$ROOT"; then
  session_git_run "$ROOT" git add -A >/dev/null 2>&1 || true
  if session_git_run "$ROOT" git diff --cached --quiet >/dev/null 2>&1; then
    MSG_PARTS+=("git:nothing-to-commit")
  else
    reason="session_end"
    final_status=""
    if command -v jq >/dev/null 2>&1 && [[ -n "${SESSION_STDIN:-}" ]]; then
      reason="$(echo "$SESSION_STDIN" | jq -r '.reason // .status // "session_end"' 2>/dev/null || echo "session_end")"
      final_status="$(echo "$SESSION_STDIN" | jq -r '.final_status // ""' 2>/dev/null || true)"
    fi
    session_build_commit_message "$ROOT" "$reason" "$final_status"
    commit_err=""
    if ! commit_err="$(printf '%s\n' "$SESSION_COMMIT_MSG" | (cd "$ROOT" && git commit -F -) 2>&1)"; then
      MSG_PARTS+=("git:commit-failed")
      session_trace "commit failed: ${commit_err}"
    else
      COMMITTED=true
      MSG_PARTS+=("git:committed")
      session_trace "committed: ${SESSION_COMMIT_SUBJECT}"
    fi
  fi
else
  MSG_PARTS+=("git:clean")
fi

# Detect automation-only changes (committed or last-pushed)
if session_is_automation_only_change "$ROOT"; then
  AUTOMATION_ONLY=true
  MSG_PARTS+=("automation-only")
  session_trace "automation-only changes detected — will skip ClickUp + run-project"
fi

REMOTE="$(session_git_run "$ROOT" git remote 2>/dev/null | head -1 || true)"
if [[ -z "$REMOTE" ]]; then
  MSG_PARTS+=("git:no-remote")
else
  BRANCH="$(session_git_run "$ROOT" git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if session_ahead_of_remote "$ROOT"; then
    push_label="$(cd "$ROOT" && git log -1 --pretty=format:'%s' 2>/dev/null || echo "latest commit")"
    push_err=""
    if session_git_run "$ROOT" git push >/dev/null 2>&1; then
      MSG_PARTS+=("git:pushed")
      session_trace "pushed ${BRANCH}: ${push_label}"
      if [[ "$AUTOMATION_ONLY" != true ]]; then
        call_clickup_on_push_success
      else
        session_trace "automation-only push — skipped ClickUp comment and run-project API"
      fi
    elif session_git_run "$ROOT" git push -u origin "$BRANCH" >/dev/null 2>&1; then
      MSG_PARTS+=("git:pushed-upstream-set")
      session_trace "pushed -u origin ${BRANCH}: ${push_label}"
      if [[ "$AUTOMATION_ONLY" != true ]]; then
        call_clickup_on_push_success
      else
        session_trace "automation-only push — skipped ClickUp comment and run-project API"
      fi
    else
      push_err="$(session_git_run "$ROOT" git push 2>&1 | tail -3 | tr '\n' ' ')"
      MSG_PARTS+=("git:push-failed")
      session_trace "push failed: ${push_err}"
    fi
  else
    MSG_PARTS+=("git:nothing-to-push")
  fi
fi

SUMMARY="session-end-git: $(IFS=','; echo "${MSG_PARTS[*]}")"
if [[ "${COMMITTED}" == true && -n "${SESSION_COMMIT_SUBJECT:-}" ]]; then
  SUMMARY="${SUMMARY} | ${SESSION_COMMIT_SUBJECT}"
fi
session_trace "$SUMMARY"
session_emit_json "$SUMMARY"
exit 0