#!/usr/bin/env bash
# Shared helpers for session-end git sync hook.
set -uo pipefail

SESSION_END_LOG="${HOME}/.cursor/hooks/session-end-git.log"
SESSION_END_TRACE="${HOME}/.cursor/hooks/session-end-trace.log"
SESSION_END_LOCK="${HOME}/.cursor/hooks/.session-end-git.lock"
SESSION_END_SKIP="${CURSOR_HOOK_SKIP_SESSION_PUSH:-}"
SESSION_END_DEBOUNCE_SEC="${CURSOR_HOOK_SESSION_PUSH_DEBOUNCE_SEC:-45}"

SESSION_STDIN=""
SESSION_HOOK_EVENT=""
SESSION_REPO_ROOT=""

session_consume_stdin() {
  SESSION_STDIN="$(cat)"
  if command -v jq >/dev/null 2>&1 && [[ -n "$SESSION_STDIN" ]]; then
    SESSION_HOOK_EVENT="$(echo "$SESSION_STDIN" | jq -r '.hook_event_name // "unknown"' 2>/dev/null || echo "unknown")"
  else
    SESSION_HOOK_EVENT="unknown"
  fi
}

session_trace() {
  local msg="$1"
  mkdir -p "$(dirname "$SESSION_END_LOG")"
  printf '%s [%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${SESSION_HOOK_EVENT:-?}" "$msg" >>"$SESSION_END_TRACE"
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$msg" >>"$SESSION_END_LOG"
}

session_find_repo_root() {
  local dir="${1:-${PWD}}"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -d "${dir}/.git" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  echo ""
}

# Prefer repo that contains this hook (.cursor/hooks → repo root).
session_repo_root_from_hooks_dir() {
  local hooks_dir="${1:-}"
  if [[ -n "$hooks_dir" ]]; then
    local candidate
    candidate="$(cd "${hooks_dir}/../.." 2>/dev/null && pwd)" || true
    if [[ -n "$candidate" && -d "${candidate}/.git" ]]; then
      echo "$candidate"
      return 0
    fi
  fi
  echo ""
}

session_resolve_repo_root() {
  local hooks_dir="${1:-}"

  local from_hooks
  from_hooks="$(session_repo_root_from_hooks_dir "$hooks_dir")"
  if [[ -n "$from_hooks" ]]; then
    echo "$from_hooks"
    return 0
  fi

  if command -v jq >/dev/null 2>&1 && [[ -n "${SESSION_STDIN:-}" ]]; then
    local root i
    local count
    count="$(echo "$SESSION_STDIN" | jq -r '.workspace_roots | length // 0' 2>/dev/null || echo 0)"
    for ((i = 0; i < count; i++)); do
      root="$(echo "$SESSION_STDIN" | jq -r ".workspace_roots[$i] // empty" 2>/dev/null || true)"
      if [[ -n "$root" && -d "${root}/.git" ]]; then
        echo "$root"
        return 0
      fi
    done
    root="$(echo "$SESSION_STDIN" | jq -r '.cwd // empty' 2>/dev/null || true)"
    if [[ -n "$root" && -d "${root}/.git" ]]; then
      echo "$root"
      return 0
    fi
  fi

  session_find_repo_root "${PWD}"
}

session_should_run_debounced() {
  local now last age
  now="$(date +%s)"
  if [[ -f "$SESSION_END_LOCK" ]]; then
    last="$(stat -c %Y "$SESSION_END_LOCK" 2>/dev/null || echo 0)"
    age=$((now - last))
    if [[ "$age" -lt "$SESSION_END_DEBOUNCE_SEC" ]]; then
      session_trace "debounced (${age}s < ${SESSION_END_DEBOUNCE_SEC}s)"
      return 1
    fi
  fi
  mkdir -p "$(dirname "$SESSION_END_LOCK")"
  touch "$SESSION_END_LOCK"
  return 0
}

session_log() {
  session_trace "$1"
}

session_emit_json() {
  local message="${1:-ok}"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg msg "$message" '{passed: true, message: $msg}'
  else
    python3 -c "import json,sys; print(json.dumps({'passed': True, 'message': sys.argv[1]}))" "$message" 2>/dev/null \
      || echo '{"passed":true}'
  fi
}

session_git_run() {
  local root="$1"
  shift
  (cd "$root" && "$@") 2>&1
}

session_has_worktree_changes() {
  local root="$1"
  local status
  status="$(cd "$root" && git status --porcelain 2>/dev/null)" || true
  [[ -n "$status" ]]
}

session_ahead_of_remote() {
  local root="$1"
  local count
  (cd "$root" && git rev-parse --verify @{u} >/dev/null 2>&1) || return 1
  count="$(cd "$root" && git rev-list --count @{u}..HEAD 2>/dev/null)" || count=0
  [[ "${count:-0}" -gt 0 ]]
}

session_build_commit_message() {
  local root="$1"
  local reason="${2:-session_end}"
  local final_status="${3:-}"

  local branch files file_count stat_line
  branch="$(cd "$root" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
  files="$(cd "$root" && git diff --cached --name-only 2>/dev/null || true)"
  file_count="$(printf '%s\n' "$files" | sed '/^$/d' | wc -l | tr -d ' ')"

  local type="chore" scope="" subject areas=""
  local has_docs=0 has_apps=0 has_test=0 has_cursor=0 has_plan=0

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    case "$f" in
      docs/*) has_docs=1 ;;
      apps/*) has_apps=1 ;;
      test/*|tests/*) has_test=1 ;;
      .cursor/*) has_cursor=1 ;;
      plan/*) has_plan=1 ;;
    esac
  done <<<"$files"

  if [[ "$has_apps" -eq 1 ]]; then
    type="feat"
    scope="$(printf '%s\n' "$files" | grep '^apps/' | head -1 | cut -d/ -f2)"
  elif [[ "$has_docs" -eq 1 && "$has_apps" -eq 0 && "$has_cursor" -eq 0 ]]; then
    type="docs"
  elif [[ "$has_test" -eq 1 && "$has_apps" -eq 0 ]]; then
    type="test"
  elif [[ "$has_cursor" -eq 1 && "$has_docs" -eq 0 && "$has_apps" -eq 0 ]]; then
    type="chore"
    scope="cursor"
  elif [[ "$has_plan" -eq 1 ]]; then
    type="chore"
    scope="plan"
  fi

  areas="$(printf '%s\n' "$files" | sed 's|/[^/]*$||' | sort -u | head -4 | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')"
  if [[ -z "$areas" ]]; then
    areas="$(printf '%s\n' "$files" | head -3 | while read -r p; do basename "$p"; done | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')"
  fi

  if [[ "$file_count" -eq 1 ]]; then
    subject="update $(basename "$(printf '%s' "$files" | head -1)")"
  elif [[ -n "$areas" ]]; then
    subject="update ${areas}"
  else
    subject="sync ${file_count} changed files"
  fi

  if [[ ${#subject} -gt 72 ]]; then
    subject="${subject:0:72}"
  fi

  stat_line="$(cd "$root" && git diff --cached --shortstat 2>/dev/null | sed 's/^ //' || true)"
  local file_list
  file_list="$(printf '%s\n' "$files" | head -12 | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')"
  if [[ "$file_count" -gt 12 ]]; then
    file_list="${file_list}, … (+$((file_count - 12)) more)"
  fi

  local header
  if [[ -n "$scope" ]]; then
    header="${type}(${scope}): ${subject}"
  else
    header="${type}: ${subject}"
  fi

  local status_bit=""
  [[ -n "$final_status" ]] && status_bit=", status ${final_status}"

  SESSION_COMMIT_SUBJECT="$header"
  SESSION_COMMIT_MSG="${header}

Cursor session ended (${reason}${status_bit})
Branch: ${branch}
Changes: ${stat_line:-${file_count} file(s)}
Files: ${file_list}"
}

# ClickUp task id: env → process.md (- **clickup_task**: id or plain clickup_task: id)
session_clickup_task_id() {
  local root="$1"
  local file="${root}/process.md"
  local line raw id

  if [[ -n "${CLICKUP_TASK_ID:-}" ]]; then
    echo "${CLICKUP_TASK_ID}"
    return 0
  fi

  if [[ ! -f "$file" ]]; then
    echo ""
    return 0
  fi

  line="$(grep -iE 'clickup_task' "$file" 2>/dev/null | head -1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return 0
  fi

  id="$(printf '%s\n' "$line" | sed -E 's/.*[Cc]lickup_task[^:]*:[[:space:]]*//; s/[[:space:]]+$//; s/\*//g')"
  echo "$id"
}

# Always build public QA URL for ClickUp (never post localhost from API .url).
session_project_url_from_response() {
  local resp="$1"
  local base="${CLICKUP_PUBLIC_BASE_URL:-https://imagent.identixweb.com}"
  local url base_path path=""

  base="${base%/}"

  if [[ -z "$resp" ]]; then
    echo ""
    return 0
  fi

  if command -v jq >/dev/null 2>&1; then
    base_path="$(echo "$resp" | jq -r '.project.base_path // empty' 2>/dev/null || true)"
    if [[ -z "$base_path" || "$base_path" == "null" ]]; then
      url="$(echo "$resp" | jq -r '.url // empty' 2>/dev/null || true)"
      if [[ -n "$url" && "$url" != "null" ]]; then
        path="$(printf '%s' "$url" | sed -E 's|^https?://[^/]+||; s|/*$||')"
        base_path="$path"
      fi
    fi
  else
    base_path="$(echo "$resp" | grep -oE '"base_path"[[:space:]]*:[[:space:]]*"[^"]*"' 2>/dev/null | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || true)"
    if [[ -z "$base_path" ]]; then
      url="$(echo "$resp" | grep -oE '"url"[[:space:]]*:[[:space:]]*"[^"]*"' 2>/dev/null | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || true)"
      if [[ -n "$url" ]]; then
        path="$(printf '%s' "$url" | sed -E 's|^https?://[^/]+||; s|/*$||')"
        base_path="$path"
      fi
    fi
  fi

  if [[ -z "$base_path" ]]; then
    echo ""
    return 0
  fi

  [[ "$base_path" != /* ]] && base_path="/${base_path}"
  echo "${base}${base_path}/"
}