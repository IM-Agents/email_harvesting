#!/usr/bin/env bash
# Shared helpers for Code-Index-MCP (mcp-index) Cursor hooks.
set -euo pipefail

MCP_INDEX_SYNC_STAMP="${HOME}/.cursor/hooks/.mcp-index-last-sync"
MCP_INDEX_RATE_LIMIT_SEC=60
MCP_INDEX_DB_REL=".mcp-index/current.db"

mcp_ensure_path() {
  export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
}

mcp_consume_stdin() {
  cat > /dev/null
}

mcp_emit_json() {
  local message="${1:-ok}"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg msg "$message" '{passed: true, message: $msg}'
  else
    python3 -c "import json,sys; print(json.dumps({'passed': True, 'message': sys.argv[1]}))" "$message" 2>/dev/null \
      || echo '{"passed":true}'
  fi
}

mcp_find_repo_root() {
  local dir="${PWD}"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -d "${dir}/.git" || -f "${dir}/${MCP_INDEX_DB_REL}" || -d "${dir}/.mcp-index" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  echo "${PWD}"
}

mcp_run_in_repo() {
  local root
  root="$(mcp_find_repo_root)"
  (cd "$root" && "$@") 2>&1 || true
}

mcp_have_index() {
  local root="${1:-$(mcp_find_repo_root)}"
  [[ -f "${root}/${MCP_INDEX_DB_REL}" ]]
}

mcp_verify_tools() {
  mcp_ensure_path
  command -v mcp-index >/dev/null 2>&1 && command -v jq >/dev/null 2>&1
}

mcp_should_skip_rate_limit() {
  if [[ ! -f "$MCP_INDEX_SYNC_STAMP" ]]; then
    return 1
  fi
  local now last age
  now="$(date +%s)"
  last="$(stat -c %Y "$MCP_INDEX_SYNC_STAMP" 2>/dev/null || echo 0)"
  age=$((now - last))
  [[ "$age" -lt "$MCP_INDEX_RATE_LIMIT_SEC" ]]
}

mcp_touch_sync_stamp() {
  mkdir -p "$(dirname "$MCP_INDEX_SYNC_STAMP")"
  touch "$MCP_INDEX_SYNC_STAMP"
}

mcp_run_sync() {
  local force_full="${1:-false}"
  if [[ "$force_full" == "true" ]]; then
    mcp_run_in_repo mcp-index repository sync --force-full
  else
    mcp_run_in_repo mcp-index repository sync
  fi
  mcp_touch_sync_stamp
}

mcp_run_preflight() {
  mcp_run_in_repo mcp-index preflight
}
