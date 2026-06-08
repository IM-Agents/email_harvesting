const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authenticate } = require("../middleware/auth.middleware")
const { success, error } = require("../utils/apiResponse")
const { getBatchReport, getAuditLogs } = require("../services/report.service")

const reportsRouter = express.Router()

reportsRouter.use(authenticate)

reportsRouter.get(
  "/batch/:batchId",
  asyncHandler(async (req, res) => {
    try {
      const data = await getBatchReport(Number(req.params.batchId), req.user.id)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

reportsRouter.get(
  "/batch/:batchId/audit-logs",
  asyncHandler(async (req, res) => {
    try {
      const data = await getAuditLogs(Number(req.params.batchId), req.user.id, req.query)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

module.exports = { reportsRouter }
