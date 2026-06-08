const { app } = require("./app")
const { env } = require("./config/env")

const port = env.API_PORT

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`[api] listening on http://127.0.0.1:${port}`)
})

const shutdown = (signal) => {
  console.log(`[api] ${signal} received, shutting down`)
  server.close(() => process.exit(0))
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
