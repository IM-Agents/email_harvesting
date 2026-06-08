const express = require("express")
const fs = require("fs")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authenticate } = require("../middleware/auth.middleware")
const { success, error } = require("../utils/apiResponse")
const { createExport, getExport, getExportDownloadPath } = require("../services/export.service")

const exportsRouter = express.Router()

exportsRouter.use(authenticate)

exportsRouter.post(
  "/batch/:batchId",
  asyncHandler(async (req, res) => {
    try {
      const data = await createExport(Number(req.params.batchId), req.user.id, req.body || {})
      return success(res, data, "Export queued", 201)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

exportsRouter.get(
  "/:exportId",
  asyncHandler(async (req, res) => {
    try {
      const data = await getExport(Number(req.params.exportId), req.user.id)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

exportsRouter.get(
  "/:exportId/download",
  asyncHandler(async (req, res) => {
    try {
      const { path: filePath, fileName } = await getExportDownloadPath(
        Number(req.params.exportId),
        req.user.id
      )
      if (!fs.existsSync(filePath)) {
        return error(res, "NOT_FOUND", "Export file missing", 404)
      }
      return res.download(filePath, fileName)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

module.exports = { exportsRouter }
