const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")

const REQUIRED_KEYS = ["PORT", "PUBLIC_PATH", "API_PORT"]

const findMonorepoRoot = (startDir) => {
  let dir = path.resolve(startDir)
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"))
      if (pkg.workspaces) return dir
    }
    dir = path.dirname(dir)
  }
  return path.resolve(startDir)
}

const applyProjectDatabaseEnv = (rootDir) => {
  const rootEnv = path.join(rootDir, ".env")
  if (!fs.existsSync(rootEnv)) return
  const parsed = dotenv.parse(fs.readFileSync(rootEnv))
  if (parsed.DB_NAME) process.env.DB_NAME = parsed.DB_NAME
}

const resolveEnvFiles = (root, appName) => {
  const nodeEnv = process.env.NODE_ENV || "development"
  const files = [
    path.join(root, ".env"),
    path.join(root, `.env.${nodeEnv}`),
    path.join(root, ".env.local"),
    path.join(root, `.env.${nodeEnv}.local`),
  ]
  if (appName) {
    files.push(path.join(root, "apps", appName, ".env"))
    files.push(path.join(root, "apps", appName, ".env.example"))
  }
  files.push(path.join(root, ".env.example"))
  return files
}

const loadEnv = ({ rootDir, appName } = {}) => {
  const root = rootDir ?? findMonorepoRoot(process.cwd())

  const cli = {}
  for (const key of REQUIRED_KEYS) {
    if (process.env[key] !== undefined && process.env[key] !== "") {
      cli[key] = process.env[key]
    }
  }

  const allSet = REQUIRED_KEYS.every(
    (k) => process.env[k] !== undefined && process.env[k] !== ""
  )
  if (!allSet) {
    const files = resolveEnvFiles(root, appName)
    for (const file of files) {
      if (fs.existsSync(file)) {
        dotenv.config({ path: file, override: false })
      }
    }

    const stillMissing = REQUIRED_KEYS.filter((k) => !process.env[k])
    if (stillMissing.length) {
      const example = path.join(root, ".env.example")
      if (fs.existsSync(example)) {
        dotenv.config({ path: example, override: false })
      }
    }
  }

  applyProjectDatabaseEnv(root)
  Object.assign(process.env, cli)

  return { source: allSet ? "process.env" : "dotenv", rootDir: root }
}

module.exports = { loadEnv, findMonorepoRoot, applyProjectDatabaseEnv }
