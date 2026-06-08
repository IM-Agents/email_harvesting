const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { env } = require("./config/env")
const { errorMiddleware } = require("./middleware/error.middleware")
const { router } = require("./routes")

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN || "*" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many login attempts" } },
})

app.use("/api", apiLimiter)
app.use("/api/v1/auth/login", authLimiter)

app.use("/api", router)

app.use(errorMiddleware)

module.exports = { app }
