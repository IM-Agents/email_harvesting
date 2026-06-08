const express = require("express")
const { healthRouter } = require("./health.routes")
const { authRouter } = require("./auth.routes")
const { batchesRouter } = require("./batches.routes")
const { domainsRouter } = require("./domains.routes")
const { contactsRouter } = require("./contacts.routes")
const { exportsRouter } = require("./exports.routes")
const { reportsRouter } = require("./reports.routes")
const { adminRouter } = require("./admin.routes")

const router = express.Router()

router.use("/health", healthRouter)
router.use("/v1/auth", authRouter)
router.use("/v1/batches", batchesRouter)
router.use("/v1/domains", domainsRouter)
router.use("/v1/contacts", contactsRouter)
router.use("/v1/exports", exportsRouter)
router.use("/v1/reports", reportsRouter)
router.use("/v1/admin", adminRouter)

module.exports = { router }
