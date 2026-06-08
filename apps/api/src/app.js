const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const { env } = require("./config/env")
const { errorMiddleware } = require("./middleware/error.middleware")
const { router } = require("./routes")

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN || "*" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api", router)

app.use(errorMiddleware)

module.exports = { app }
