const { env } = require("../config/env")

const errorMiddleware = (err, _req, res, _next) => {
  const status = err.status || 500
  const message = err.message || "Internal Server Error"

  if (env.NODE_ENV !== "production") {
    console.error("[api] error:", err.message)
  }

  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message,
      details: {},
    },
  })
}

module.exports = { errorMiddleware }
