#!/usr/bin/env bash
# Shared helpers for code-review-graph Cursor hooks.
# https://github.com/tirth8205/code-review-graph
set -euo pipefail

CRG_REPO_URL="https://github.com/tirth8205/code-review-graph"
CRG_GIT_INSTALL="git+${CRG_REPO_URL}.git"
CRG_UPGRADE_STAMP="${HOME}/.cursor/hooks/.crg-last-cli-upgrade"
CRG_UPGRADE_INTERVAL_SEC=86400

crg_consume_stdin() {
  cat > /dev/null
}

crg_emit_json() {
  local message="${1:-ok}"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg msg "$message" '{passed: true, message: $msg}'
  else
    python3 -c "import json,sys; print(json.dumps({'passed': True, 'message': sys.argv[1]}))" "$message" 2>/dev/null \
      || echo '{"passed":true}'
  fi
}

crg_find_repo_root() {
  local dir="${PWD}"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -d "${dir}/.git" || -d "${dir}/.code-review-graph" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  echo "${PWD}"
}

crg_run_in_repo() {
  local root
  root="$(crg_find_repo_root)"
  (cd "$root" && "$@") 2>&1 || true
}

crg_upgrade_cli_if_stale() {
  if ! command -v code-review-graph >/dev/null 2>&1; then
    if command -v pipx >/dev/null 2>&1; then
      pipx install "$CRG_GIT_INSTALL" >/dev/null 2>&1 || true
    elif command -v pip >/dev/null 2>&1; then
      pip install --user "$CRG_GIT_INSTALL" >/dev/null 2>&1 || true
    fi
    return 0
  fi

  if [[ -f "$CRG_UPGRADE_STAMP" ]]; then
    local now last age
    now="$(date +%s)"
    last="$(stat -c %Y "$CRG_UPGRADE_STAMP" 2>/dev/null || echo 0)"
    age=$((now - last))
    if [[ "$age" -lt "$CRG_UPGRADE_INTERVAL_SEC" ]]; then
      return 0
    fi
  fi

  mkdir -p "$(dirname "$CRG_UPGRADE_STAMP")"

  if command -v pipx >/dev/null 2>&1; then
    pipx upgrade code-review-graph >/dev/null 2>&1 \
      || pipx install --force "$CRG_GIT_INSTALL" >/dev/null 2>&1 \
      || true
  elif command -v pip >/dev/null 2>&1; then
    pip install --user -U code-review-graph >/dev/null 2>&1 \
      || pip install --user -U "$CRG_GIT_INSTALL" >/dev/null 2>&1 \
      || true
  fi

  touch "$CRG_UPGRADE_STAMP"
}
