const { spawn, execSync } = require("child_process")
const path = require("path")
const fs = require("fs")
const net = require("net")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

const ROOT = findMonorepoRoot(path.join(__dirname, ".."))
const cliPublicPath = process.env.PUBLIC_PATH
const cliPort = process.env.PORT
const cliApiPort = process.env.API_PORT
loadEnv({ rootDir: ROOT })
if (cliPublicPath) process.env.PUBLIC_PATH = cliPublicPath
if (cliPort) process.env.PORT = cliPort
if (cliApiPort) process.env.API_PORT = cliApiPort

function ensureDatabaseForPreview() {
  const apiDir = fs.existsSync(path.join(ROOT, "apps/api"))
    ? path.join(ROOT, "apps/api")
    : path.join(ROOT, "app/backend")
  const run = (script) => {
    console.log(`[preview] npm run ${script} (${apiDir}) DB_NAME=${process.env.DB_NAME}`)
    execSync(`npm run ${script}`, { cwd: apiDir, stdio: "inherit", env: process.env })
  }
  try {
    run("db:migrate")
  } catch (err) {
    const msg = String(err.message || err)
    if (/corrupt|migration directory/i.test(msg)) {
      console.error(
        "[preview] Knex migration directory is corrupt — usually wrong DB_NAME.",
        "Set DB_NAME=email_harvesting_app in .env,",
        "DROP/CREATE that schema in dev, then: npm run db:init --workspace=api"
      )
      throw err
    }
    console.log("[preview] db:migrate failed — running db:init (missing schema only)")
    run("db:init")
  }
}

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close()
      resolve(true)
    })
    server.listen(port, "127.0.0.1")
  })

const findAvailablePort = async (start, end = 9999) => {
  const base = parseInt(start, 10) || 4000
  for (let port = base; port <= end; port++) {
    if (await isPortAvailable(port)) return port
  }
  throw new Error(`No free port in range ${base}–${end}`)
}

async function main() {
  ensureDatabaseForPreview()

  const preferredPort = parseInt(process.env.PORT || "8080", 10)
  const preferredApiPort = parseInt(process.env.API_PORT || "4000", 10)
  const PORT = await findAvailablePort(preferredPort)
  let API_PORT = await findAvailablePort(preferredApiPort)
  if (API_PORT === PORT) {
    API_PORT = await findAvailablePort(PORT + 1)
  }
  if (PORT !== preferredPort) {
    console.log(`[preview] PORT ${preferredPort} in use → ${PORT}`)
  }
  if (API_PORT !== preferredApiPort) {
    console.log(`[preview] API_PORT ${preferredApiPort} in use → ${API_PORT}`)
  }
  process.env.PORT = String(PORT)
  process.env.API_PORT = String(API_PORT)

  const PUBLIC_PATH = (process.env.PUBLIC_PATH || "/").replace(/\/$/, "") || "/"
  const previewPath = PUBLIC_PATH.startsWith("/") ? PUBLIC_PATH : `/${PUBLIC_PATH}`
  const pidFile = path.join(ROOT, ".preview.pids")
  const pids = []

  const envPrefix = `PUBLIC_PATH='${PUBLIC_PATH.replace(/'/g, "'\\''")}' PORT=${PORT} API_PORT=${API_PORT} NODE_ENV=production`

  function startBackground(label, shellCmd, cwd) {
    const logPath = path.join(ROOT, `preview-${label}.log`)
    const logFd = fs.openSync(logPath, "a")
    const proc = spawn("sh", ["-c", `${envPrefix} ${shellCmd}`], {
      cwd,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    })
    proc.unref()
    fs.closeSync(logFd)
    pids.push(proc.pid)
    console.log(`[preview] ${label} started in background (pid ${proc.pid}, log ${logPath})`)
    return proc
  }

  startBackground("api", `${process.execPath} dist/index.js`, path.join(ROOT, "apps/api"))
  startBackground("proxy", `${process.execPath} ${path.join(__dirname, "proxy.js")}`, ROOT)

  const portsFile = path.join(ROOT, ".preview.ports")
  fs.writeFileSync(portsFile, `PORT=${PORT}\nAPI_PORT=${API_PORT}\n`)
  fs.writeFileSync(pidFile, pids.join("\n") + "\n")
  console.log(
    `[preview] Ready → proxy http://127.0.0.1:${PORT}${previewPath} | API http://127.0.0.1:${API_PORT}`
  )
}

main().catch((err) => {
  console.error("[preview] failed:", err.message)
  process.exit(1)
})
