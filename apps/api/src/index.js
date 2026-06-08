const { app } = require("./app")
const { env } = require("./config/env")

const port = env.API_PORT

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`[api] listening on http://127.0.0.1:${port}`)
  if (env.REDIS_URL) {
    const { initQueue } = require("./queue/domainQueue")
    initQueue().catch((err) => {
      console.error("[api] queue init failed:", err.message)
    })
  }
})

const shutdown = async (signal) => {
  console.log(`[api] ${signal} received, shutting down`)
  try {
    const { closeAllBrowsers } = require("./scrapers/browserManager")
    const { shutdownQueue } = require("./queue/domainQueue")
    await closeAllBrowsers()
    await shutdownQueue()
  } catch (err) {
    console.error("[api] shutdown cleanup error:", err.message)
  }
  server.close(() => process.exit(0))
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
