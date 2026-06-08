const path = require("path")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

loadEnv({ rootDir: findMonorepoRoot(__dirname) })

module.exports = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    directory: path.join(__dirname, "migrations"),
    tableName: "knex_migrations",
  },
  pool: {
    min: 0,
    max: 10,
  },
}
