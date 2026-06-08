const { execSync } = require("child_process")
const path = require("path")
const mysql = require("mysql2/promise")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

const ROOT = findMonorepoRoot(path.join(__dirname, "../.."))
const API_DIR = path.join(__dirname, "..")

loadEnv({ rootDir: ROOT })

const main = async () => {
  const host = process.env.DB_HOST || "localhost"
  const port = Number(process.env.DB_PORT || 3306)
  const user = process.env.DB_USER || "root"
  const password = process.env.DB_PASSWORD || ""
  const database = process.env.DB_NAME || "email_harvesting_app"

  console.log(`[db:init] Connecting to MySQL at ${host}:${port} as ${user}`)

  const connection = await mysql.createConnection({ host, port, user, password })

  const [rows] = await connection.execute(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
    [database]
  )

  if (rows.length === 0) {
    await connection.execute(`CREATE DATABASE \`${database}\``)
    console.log(`[db:init] Created database ${database}`)
  } else {
    console.log(`[db:init] Database ${database} already exists`)
  }

  await connection.end()

  console.log("[db:init] Running knex migrate:latest")
  execSync("npx knex migrate:latest", {
    cwd: API_DIR,
    stdio: "inherit",
    env: process.env,
  })
}

main().catch((err) => {
  console.error("[db:init] failed:", err.message)
  process.exit(1)
})
