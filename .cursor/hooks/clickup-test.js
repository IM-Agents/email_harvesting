#!/usr/bin/env node
/**
 * Manual ClickUp hook test — run from project root:
 *   node .cursor/hooks/clickup-test.js
 *
 * Requires CLICKUP_API_TOKEN or .cursor/hooks/clickup.config.json apiToken
 */
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const root = process.env.CURSOR_PROJECT_DIR || process.cwd()
const script = path.join(root, ".cursor", "hooks", "clickup-session.js")

console.log("Project root:", root)
console.log("process.md exists:", fs.existsSync(path.join(root, "process.md")))

if (fs.existsSync(path.join(root, "process.md"))) {
  console.log("process.md clickup line:")
  const text = fs.readFileSync(path.join(root, "process.md"), "utf8")
  const m = text.match(/clickup_task\s*:\s*(\S+)/i)
  console.log(" ", m ? m[1] : "NOT FOUND")
}

const hasEnv = Boolean(process.env.CLICKUP_API_TOKEN || process.env.CLICKUP_TOKEN)
const cfgPath = path.join(root, ".cursor", "hooks", "clickup.config.json")
const hasCfg = fs.existsSync(cfgPath)
console.log("CLICKUP_API_TOKEN env:", hasEnv ? "yes" : "NO")
console.log("clickup.config.json:", hasCfg ? "yes" : "NO (copy from clickup.config.example.json)")

if (!hasEnv && !hasCfg) {
  console.error("\nFix: set token then re-run this test.")
  process.exit(1)
}

const runPhase = (label, phase, body) => {
  console.log(`\nPosting test comment (${label})...`)
  execSync(`node "${script}" ${phase}`, {
    cwd: root,
    input: JSON.stringify(body),
    stdio: ["pipe", "inherit", "inherit"],
    env: { ...process.env, CURSOR_PROJECT_DIR: root },
  })
}

const sessionPayload = {
  session_id: "manual-test",
  composer_mode: "agent",
  is_background_agent: false,
}

try {
  runPhase("start", "start", sessionPayload)
  runPhase("stop", "stop", {
    ...sessionPayload,
    status: "completed",
  })
  runPhase("end", "end", {
    ...sessionPayload,
    reason: "manual",
    duration_ms: 120000,
    final_status: "completed",
  })
} catch (e) {
  process.exit(e.status || 1)
}

const logPath = path.join(root, ".cursor", "hooks", "clickup-last-run.log")
if (fs.existsSync(logPath)) {
  console.log("\nLast log lines:")
  const lines = fs.readFileSync(logPath, "utf8").trim().split("\n")
  lines.slice(-3).forEach((l) => console.log(" ", l))
}

console.log("\nDone. Check ClickUp task comments and clickup-last-run.log")
