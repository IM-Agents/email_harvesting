#!/usr/bin/env bash
# CodeRabbit CLI wrapper for IM Agent Docker tasks.
# Avoids Cursor agent shell ~90s timeout by running cr in background; agent polls with short status calls.
set -euo pipefail

export PATH="/home/node/.local/bin:/root/.local/bin:${PATH:-}"
export HOME="${HOME:-/home/node}"

MAX_WAIT_SEC="${CODERABBIT_REVIEW_MAX_WAIT_SEC:-1800}"
POLL_SEC="${CODERABBIT_REVIEW_POLL_SEC:-15}"
STATE_DIR="/tmp/im-agent-coderabbit"
mkdir -p "$STATE_DIR" reports/coderabbit

active_file="${STATE_DIR}/active"
cmd="${1:-}"

get_active() {
  if [[ -f "$active_file" ]]; then
    cat "$active_file"
  fi
}

write_active() {
  printf '%s' "$1" > "$active_file"
}

paths_for() {
  local ts="$1"
  CR_TMP="/tmp/coderabbit-review-${ts}.tmp"
  CR_FINAL="reports/coderabbit/coderabbit-review-${ts}.txt"
  CR_EXIT="${STATE_DIR}/coderabbit-review-${ts}.exit"
  CR_PID="${STATE_DIR}/coderabbit-review-${ts}.pid"
  CR_STARTED="${STATE_DIR}/coderabbit-review-${ts}.started"
}

elapsed_sec() {
  local ts="$1"
  paths_for "$ts"
  if [[ ! -f "$CR_STARTED" ]]; then
    echo 0
    return
  fi
  local started now
  started="$(cat "$CR_STARTED")"
  now="$(date +%s)"
  echo $((now - started))
}

force_timeout() {
  local ts="$1"
  paths_for "$ts"
  local elapsed
  elapsed="$(elapsed_sec "$ts")"

  if [[ -f "$CR_PID" ]]; then
    kill "$(cat "$CR_PID")" 2>/dev/null || true
  fi

  {
    echo "CodeRabbit review timed out after ${MAX_WAIT_SEC}s (waited ${elapsed}s)."
    echo "Proceeding to manual /code-review with partial or no CodeRabbit output."
    echo "---"
    if [[ -f "$CR_TMP" ]]; then
      cat "$CR_TMP"
    else
      echo "(no CodeRabbit output captured)"
    fi
  } > "$CR_FINAL"

  echo 124 > "$CR_EXIT"
  echo "state=timeout ts=${ts} waited_sec=${elapsed} exit=124 final_report=${CR_FINAL}"
}

case "$cmd" in
  start)
    active="$(get_active)"
    if [[ -n "$active" ]]; then
      paths_for "$active"
      if [[ -f "$CR_EXIT" ]]; then
        echo "already_finished ts=${active} final_report=${CR_FINAL}"
        exit 0
      fi
      if [[ -f "$CR_PID" ]] && kill -0 "$(cat "$CR_PID")" 2>/dev/null; then
        echo "already_running ts=${active} final_report=${CR_FINAL} max_wait_sec=${MAX_WAIT_SEC}"
        exit 0
      fi
    fi

    git config --global --add safe.directory "$(pwd)" || true
    ts="$(date +%Y%m%d-%H%M%S)"
    paths_for "$ts"
    write_active "$ts"
    date +%s > "$CR_STARTED"

    nohup bash -c "
      set -o pipefail
      cr 2>&1 | tee '${CR_TMP}'
      echo \$? > '${CR_EXIT}'
    " >/dev/null 2>&1 &
    echo $! > "$CR_PID"

    echo "started ts=${ts} final_report=${CR_FINAL} max_wait_sec=${MAX_WAIT_SEC}"
    ;;

  status)
    active="$(get_active)"
    if [[ -z "$active" ]]; then
      echo "state=not_started"
      exit 0
    fi

    paths_for "$active"
    elapsed="$(elapsed_sec "$active")"

    if [[ -f "$CR_EXIT" ]]; then
      cr_exit="$(cat "$CR_EXIT")"
      if [[ ! -f "$CR_FINAL" ]]; then
        if [[ -f "$CR_TMP" ]]; then
          cp "$CR_TMP" "$CR_FINAL"
        fi
      fi
      if [[ "$cr_exit" == "124" ]]; then
        echo "state=timeout ts=${active} waited_sec=${elapsed} exit=124 final_report=${CR_FINAL}"
      else
        echo "state=done ts=${active} waited_sec=${elapsed} exit=${cr_exit} final_report=${CR_FINAL}"
      fi
      exit 0
    fi

    if [[ "$elapsed" -ge "$MAX_WAIT_SEC" ]]; then
      force_timeout "$active"
      exit 124
    fi

    if [[ -f "$CR_PID" ]] && kill -0 "$(cat "$CR_PID")" 2>/dev/null; then
      echo "state=running ts=${active} waited_sec=${elapsed} max_wait_sec=${MAX_WAIT_SEC} final_report=${CR_FINAL}"
      exit 0
    fi

    echo "state=running ts=${active} waited_sec=${elapsed} max_wait_sec=${MAX_WAIT_SEC} final_report=${CR_FINAL} note=pid_not_found_still_wait"
    ;;

  wait)
    active="$(get_active)"
    if [[ -z "$active" ]]; then
      echo "error=not_started run start first"
      exit 1
    fi

    paths_for "$active"
    while [[ ! -f "$CR_EXIT" ]]; do
      elapsed="$(elapsed_sec "$active")"
      if [[ "$elapsed" -ge "$MAX_WAIT_SEC" ]]; then
        force_timeout "$active"
        exit 124
      fi
      sleep "$POLL_SEC"
    done

    cr_exit="$(cat "$CR_EXIT")"
    if [[ "$cr_exit" != "124" ]] && [[ -f "$CR_TMP" ]]; then
      cp "$CR_TMP" "$CR_FINAL"
    fi
    elapsed="$(elapsed_sec "$active")"
    if [[ "$cr_exit" == "124" ]]; then
      echo "state=timeout ts=${active} waited_sec=${elapsed} exit=124 final_report=${CR_FINAL}"
      exit 124
    fi
    echo "state=done ts=${active} waited_sec=${elapsed} exit=${cr_exit} final_report=${CR_FINAL}"
    exit "$cr_exit"
    ;;

  finalize)
    active="$(get_active)"
    if [[ -z "$active" ]]; then
      echo "error=not_started"
      exit 1
    fi

    paths_for "$active"
    if [[ ! -f "$CR_FINAL" ]]; then
      if [[ -f "$CR_TMP" ]]; then
        cp "$CR_TMP" "$CR_FINAL"
      else
        force_timeout "$active" >/dev/null
      fi
    fi

    git add "$CR_FINAL" || true
    rm -f "$CR_TMP" "$CR_EXIT" "$CR_PID" "$CR_STARTED" "$active_file"
    echo "finalized final_report=${CR_FINAL}"
    ;;

  *)
    echo "Usage: $0 {start|status|wait|finalize}"
    echo "  start    — background cr (returns in <5s)"
    echo "  status   — quick check (running|done|timeout); enforces max wait ${MAX_WAIT_SEC}s"
    echo "  wait     — block until done or timeout (avoid in agent shell; use status polling)"
    echo "  finalize — git add report and cleanup; then proceed to manual /code-review"
    exit 1
    ;;
esac
