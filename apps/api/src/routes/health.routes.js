const { Router } = require("express")

const healthRouter = Router()

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "email-harvesting-api",
    timestamp: new Date().toISOString(),
  })
})

module.exports = { healthRouter }
