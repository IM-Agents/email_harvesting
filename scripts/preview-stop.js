const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const pidFile = path.join(ROOT, ".preview.pids")

function killPid(pid) {
  try {
    process.kill(pid, "SIGTERM")
  } catch {
    // already dead
  }
}

if (fs.existsSync(pidFile)) {
  const pids = fs.readFileSync(pidFile, "utf8").trim().split("\n").filter(Boolean)
  pids.forEach((pid) => killPid(Number(pid)))
  fs.unlinkSync(pidFile)
  console.log(`[preview] Stopped ${pids.length} process(es)`)
} else {
  console.log("[preview] No .preview.pids file found")
}

const portsFile = path.join(ROOT, ".preview.ports")
let assigned = {}
if (fs.existsSync(portsFile)) {
  assigned = Object.fromEntries(
    fs
      .readFileSync(portsFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf("=")
        return [line.slice(0, i), line.slice(i + 1)]
      })
  )
  fs.unlinkSync(portsFile)
}

const ports = [
  assigned.PORT || process.env.PORT,
  assigned.API_PORT || process.env.API_PORT,
  process.env.WEB_PORT,
].filter(Boolean)

for (const port of ports) {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" })
  } catch {
    // ignore
  }
}
