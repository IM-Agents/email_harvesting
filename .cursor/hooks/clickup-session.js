#!/usr/bin/env node
/**
 * Cursor sessionStart / sessionEnd / stop / beforeSubmitPrompt → ClickUp task comments.
 *
 * Task ID (first match):
 *   CLICKUP_TASK_ID env → process.md key `- **clickup_task**:` → clickup.config.json → git branch CU-*
 *
 * API token (first match):
 *   CLICKUP_API_TOKEN | CLICKUP_TOKEN env → clickup.config.json (apiToken)
 *
 * Config file: copy clickup.config.example.json → clickup.config.json (see README).
 *
 * Fail-open: missing config or API errors log to stderr and exit 0.
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const phase = (process.argv[2] || "").toLowerCase()
const START_PHASES = new Set(["start", "prompt"])
if (
  !START_PHASES.has(phase) &&
  phase !== "end" &&
  phase !== "stop"
) {
  process.stderr.write(
    "clickup-session.js: usage: node clickup-session.js <start|end|stop|prompt>\n"
  )
  process.exit(1)
}

const STDIN_TIMEOUT_MS = 2500

const readStdin = () =>
  new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve({})
      return
    }

    const chunks = []
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }

    const timer = setTimeout(() => finish({}), STDIN_TIMEOUT_MS)

    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (c) => chunks.push(c))
    process.stdin.on("end", () => {
      const raw = chunks.join("").trim()
      if (!raw) {
        finish({})
        return
      }
      try {
        finish(JSON.parse(raw))
      } catch {
        finish({})
      }
    })
    process.stdin.resume()
  })

const projectRoot = () =>
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd()

const writeLog = (root, entry) => {
  try {
    const logPath = path.join(root, ".cursor", "hooks", "clickup-last-run.log")
    const line = `[${new Date().toISOString()}] ${entry}\n`
    fs.appendFileSync(logPath, line, "utf8")
  } catch {
    /* ignore log write failures */
  }
}

const sessionStatePath = (root) =>
  path.join(root, ".cursor", "hooks", ".clickup-session-state.json")

const loadSessionState = (root) => {
  try {
    const raw = fs.readFileSync(sessionStatePath(root), "utf8")
    const data = JSON.parse(raw)
    return data && typeof data === "object" ? data : {}
  } catch {
    return {}
  }
}

const saveSessionState = (root, state) => {
  try {
    fs.writeFileSync(sessionStatePath(root), JSON.stringify(state, null, 2), "utf8")
  } catch (err) {
    process.stderr.write(`clickup-session: could not save session state: ${err.message}\n`)
  }
}

const sessionKey = (input) => {
  const id =
    input.conversation_id ||
    input.session_id ||
    input.transcript_id ||
    "unknown"
  return String(id).trim() || "unknown"
}

/** prompt/start and stop backfill are tracked separately so stop does not block the next prompt */
const hasPostedStart = (root, input, channel) => {
  const key = sessionKey(input)
  const entry = loadSessionState(root)[key] || {}
  if (channel === "prompt" || channel === "start") {
    return Boolean(entry.promptStartPosted)
  }
  if (channel === "stop") {
    return Boolean(entry.stopStartPosted)
  }
  return Boolean(entry.startPosted)
}

const markStartPosted = (root, input, channel) => {
  const key = sessionKey(input)
  const state = loadSessionState(root)
  const prev = state[key] || {}
  state[key] = {
    ...prev,
    startPosted: true,
    startedAt: prev.startedAt || new Date().toISOString(),
    ...(channel === "prompt" || channel === "start"
      ? { promptStartPosted: true }
      : {}),
    ...(channel === "stop" ? { stopStartPosted: true } : {}),
  }
  saveSessionState(root, state)
}

/** After agent run ends, allow Session started on the next user message */
const resetPromptStartForNextTurn = (root, input) => {
  const key = sessionKey(input)
  const state = loadSessionState(root)
  if (!state[key]) return
  state[key].promptStartPosted = false
  saveSessionState(root, state)
  writeLog(root, `reset prompt start flag for next turn (session ${key})`)
}

const clearSessionState = (root, input) => {
  const key = sessionKey(input)
  const state = loadSessionState(root)
  if (!state[key]) return
  delete state[key]
  saveSessionState(root, state)
}

const writeHookStdout = () => {
  process.stdout.write("{}\n")
}

const readJsonFile = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (err) {
    process.stderr.write(`clickup-session: invalid JSON in ${file}: ${err.message}\n`)
    return null
  }
}

/** Same keys as clickup.config.example.json */
const loadConfig = (root) => {
  const hooksDir = path.join(root, ".cursor", "hooks")
  const candidates = [
    path.join(hooksDir, "clickup.config.json"),
    path.join(root, ".cursor", "clickup.config.json"),
    path.join(root, "clickup.config.json"),
    path.join(hooksDir, "clickup.config.example.json"),
  ]

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const data = readJsonFile(file)
    if (!data) continue
    if (file.endsWith(".example.json")) {
      process.stderr.write(
        "clickup-session: using clickup.config.example.json — copy to clickup.config.json and add to .gitignore.\n"
      )
    }
    return { ...data, _configPath: file }
  }

  return {}
}

/** Raw value from process.md `- **clickup_task**: ...` */
const rawClickupTaskFromProcessMd = (root) => {
  const file = path.join(root, "process.md")
  if (!fs.existsSync(file)) return null

  const patterns = [
    /^\s*-\s*\*\*clickup_task\*\*\s*:\s*(\S+)/im,
    /^\s*-\s*clickup_task\s*:\s*(\S+)/im,
    /^\s*\*\*clickup_task\*\*\s*:\s*(\S+)/im,
    /^\s*clickup_task\s*:\s*(\S+)/im,
  ]

  try {
    const text = fs.readFileSync(file, "utf8")
    for (const re of patterns) {
      const match = text.match(re)
      if (match && match[1]) return match[1].trim()
    }
    return null
  } catch (err) {
    process.stderr.write(`clickup-session: could not read process.md: ${err.message}\n`)
    return null
  }
}

/**
 * Parse task target for ClickUp API.
 * process.md formats:
 *   - **clickup_task**: 86abc123           → internal task id
 *   - **clickup_task**: 3638847/ACC-30296 → team_id / custom task id (needs custom_task_ids=true)
 */
const parseClickupTaskValue = (raw) => {
  const value = String(raw).trim()
  if (!value) return null

  if (value.includes("/")) {
    const [teamId, taskId] = value.split("/").map((s) => s.trim())
    if (!teamId || !taskId) return null
    return {
      taskId,
      teamId,
      customTaskIds: true,
      source: "process.md",
      raw: value,
    }
  }

  return {
    taskId: value,
    teamId: null,
    customTaskIds: false,
    source: "process.md",
    raw: value,
  }
}

const taskIdFromBranch = (root) => {
  try {
    const branch = execSync("git branch --show-current", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    const match =
      branch.match(/CU-([a-z0-9]+)/i) ||
      branch.match(/clickup[/-]([a-z0-9]+)/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

const resolveClickupTarget = (root, config) => {
  if (process.env.CLICKUP_TASK_ID) {
    const parsed = parseClickupTaskValue(process.env.CLICKUP_TASK_ID)
    if (parsed) {
      parsed.source = "env"
      return parsed
    }
  }

  const fromProcess = rawClickupTaskFromProcessMd(root)
  if (fromProcess) {
    const parsed = parseClickupTaskValue(fromProcess)
    if (parsed) return parsed
  }

  const fromConfig = config.taskId || config.task_id
  if (fromConfig) {
    const parsed = parseClickupTaskValue(String(fromConfig))
    if (parsed) {
      parsed.source = "config"
      parsed.teamId =
        parsed.teamId || config.teamId || config.team_id || process.env.CLICKUP_TEAM_ID
      parsed.customTaskIds =
        parsed.customTaskIds ||
        Boolean(config.customTaskIds || config.custom_task_ids)
      return parsed
    }
  }

  const fromBranch = taskIdFromBranch(root)
  if (fromBranch) {
    return {
      taskId: fromBranch,
      teamId: config.teamId || config.team_id || process.env.CLICKUP_TEAM_ID || null,
      customTaskIds: Boolean(config.customTaskIds || config.custom_task_ids),
      source: "branch",
      raw: fromBranch,
    }
  }

  return null
}

const resolveToken = (config) => {
  const fromEnv = process.env.CLICKUP_API_TOKEN || process.env.CLICKUP_TOKEN
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim()

  const fromConfig = config.apiToken || config.api_token
  if (fromConfig && String(fromConfig).trim()) return String(fromConfig).trim()

  return null
}

const formatDuration = (ms) => {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "unknown"
  if (ms < 1000) return `${ms} ms`
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  return rem ? `${min}m ${rem}s` : `${min}m`
}

const buildComment = (input, config, phaseName = phase) => {
  const prefix = config.commentPrefix || config.comment_prefix || "[Cursor]"
  const sessionId = input.session_id || "unknown"
  const mode = input.composer_mode || "unknown"
  const bg = input.is_background_agent ? "yes" : "no"

  if (phaseName === "start" || START_PHASES.has(phaseName)) {
    const lines = [
      `${prefix} Session started`,
      "",
      `- Session: \`${sessionId}\``,
      `- Mode: ${mode}`,
      `- Background agent: ${bg}`,
      `- Project: ${projectRoot()}`,
      `- Started: ${new Date().toISOString()}`,
    ]
    return lines.join("\n")
  }

  if (phaseName === "stop") {
    const status = input.status || input.final_status || "completed"
    const loop = input.loop_count != null ? String(input.loop_count) : "—"
    const lines = [
      `${prefix} Agent run finished`,
      "",
      `- Session: \`${sessionId}\``,
      `- Status: ${status}`,
      `- Loop: ${loop}`,
      `- Mode: ${mode}`,
      `- Background agent: ${bg}`,
      `- Finished: ${new Date().toISOString()}`,
    ]
    if (input.error_message) {
      lines.push(`- Error: ${input.error_message}`)
    }
    return lines.join("\n")
  }

  const reason = input.reason || "unknown"
  const duration = formatDuration(input.duration_ms)
  const status = input.final_status || "—"
  const lines = [
    `${prefix} Session ended`,
    "",
    `- Session: \`${sessionId}\``,
    `- Reason: ${reason}`,
    `- Duration: ${duration}`,
    `- Final status: ${status}`,
    `- Background agent: ${bg}`,
    `- Ended: ${new Date().toISOString()}`,
  ]
  if (input.error_message) {
    lines.push(`- Error: ${input.error_message}`)
  }
  return lines.join("\n")
}

const postComment = async ({ taskId, token, commentText, config }) => {
  const base = "https://api.clickup.com/api/v2/task"
  const params = new URLSearchParams()
  if (config.customTaskIds || config.custom_task_ids) {
    params.set("custom_task_ids", "true")
    const teamId = config.teamId || config.team_id || process.env.CLICKUP_TEAM_ID
    if (teamId) params.set("team_id", String(teamId))
  }
  const qs = params.toString()
  const url = `${base}/${encodeURIComponent(taskId)}/comment${qs ? `?${qs}` : ""}`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      comment_text: commentText,
      notify_all: Boolean(config.notifyAll ?? config.notify_all ?? false),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`ClickUp API ${res.status}: ${body.slice(0, 500)}`)
  }
  return res.json()
}

const postStartIfNeeded = async ({
  input,
  config,
  target,
  token,
  apiConfig,
  root,
  reason,
  channel,
}) => {
  if (hasPostedStart(root, input, channel)) {
    writeLog(
      root,
      `skip start (${reason}/${channel}) — already posted for session ${sessionKey(input)}`
    )
    return true
  }

  const commentText = buildComment(input, config, "start")

  try {
    await postComment({
      taskId: target.taskId,
      token,
      commentText,
      config: apiConfig,
    })
    const msg = `OK posted start (${reason}/${channel}) on task ${target.taskId} (source=${target.source}, custom=${target.customTaskIds}, team=${target.teamId || "n/a"})`
    process.stderr.write(`clickup-session: ${msg}\n`)
    writeLog(root, msg)
    markStartPosted(root, input, channel)
    return true
  } catch (err) {
    const msg = `FAIL start (${reason}/${channel}): ${err.message}`
    process.stderr.write(`clickup-session: ${msg}\n`)
    writeLog(root, msg)
    return false
  }
}

const main = async () => {
  const input = await readStdin()
  const root = projectRoot()
  const config = loadConfig(root)
  const token = resolveToken(config)
  const target = resolveClickupTarget(root, config)

  writeLog(
    root,
    `phase=${phase} session=${sessionKey(input)} keys=${Object.keys(input).join(",") || "empty"} root=${root} token=${token ? "yes" : "NO"} target=${target ? JSON.stringify(target) : "NONE"}`
  )

  if (!token) {
    const msg =
      "skipped — no token. Set CLICKUP_API_TOKEN in env OR apiToken in .cursor/hooks/clickup.config.json (copy from clickup.config.example.json). Restart Cursor after env change."
    process.stderr.write(`clickup-session: ${msg}\n`)
    writeLog(root, msg)
    writeHookStdout()
    process.exit(0)
  }

  if (!target?.taskId) {
    const msg =
      "skipped — no task id. Set `- **clickup_task**: <id>` or `team_id/CUSTOM-ID` in process.md."
    process.stderr.write(`clickup-session: ${msg}\n`)
    writeLog(root, msg)
    writeHookStdout()
    process.exit(0)
  }

  const apiConfig = {
    ...config,
    customTaskIds: target.customTaskIds,
    custom_task_ids: target.customTaskIds,
    teamId: target.teamId || config.teamId || config.team_id,
    team_id: target.teamId || config.teamId || config.team_id,
  }

  if (START_PHASES.has(phase)) {
    await postStartIfNeeded({
      input,
      config,
      target,
      token,
      apiConfig,
      root,
      reason: phase,
      channel: phase === "prompt" ? "prompt" : "start",
    })
    writeHookStdout()
    process.exit(0)
  }

  if (phase === "stop" || phase === "end") {
    await postStartIfNeeded({
      input,
      config,
      target,
      token,
      apiConfig,
      root,
      reason: `backfill-before-${phase}`,
      channel: "stop",
    })
  }

  const commentText = buildComment(input, config)

  try {
    await postComment({
      taskId: target.taskId,
      token,
      commentText,
      config: apiConfig,
    })
    const msg = `OK posted ${phase} on task ${target.taskId} (source=${target.source}, custom=${target.customTaskIds}, team=${target.teamId || "n/a"})`
    process.stderr.write(`clickup-session: ${msg}\n`)
    writeLog(root, msg)
  } catch (err) {
    const msg = `FAIL ${phase}: ${err.message}`
    process.stderr.write(`clickup-session: ${msg}\n`)
    writeLog(root, msg)
  }

  if (phase === "stop") {
    resetPromptStartForNextTurn(root, input)
  }

  if (phase === "end") {
    clearSessionState(root, input)
  }

  writeHookStdout()
  process.exit(0)
}

main().catch((err) => {
  process.stderr.write(`clickup-session: ${err.message}\n`)
  writeHookStdout()
  process.exit(0)
})
