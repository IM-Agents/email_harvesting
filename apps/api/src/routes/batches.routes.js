const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authenticate } = require("../middleware/auth.middleware")
const { success, error } = require("../utils/apiResponse")
const {
  createBatchFromUpload,
  listBatches,
  getBatchDetail,
  updateBatchStatus,
  getDashboardMetrics,
  UPLOAD_DIR,
} = require("../services/batch.service")
const { listBatchContacts } = require("../services/contact.service")
const { createExport } = require("../services/export.service")
const { getBatchReport } = require("../services/report.service")

const upload = multer({
  dest: path.join(UPLOAD_DIR, "tmp"),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (![".csv", ".xls", ".xlsx"].includes(ext)) {
      return cb(new Error("Only CSV, XLS, and XLSX files are allowed"))
    }
    return cb(null, true)
  },
})

if (!fs.existsSync(path.join(UPLOAD_DIR, "tmp"))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, "tmp"), { recursive: true })
}

const batchesRouter = express.Router()

batchesRouter.use(authenticate)

batchesRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const data = await getDashboardMetrics(req.user.id)
    return success(res, data)
  })
)

batchesRouter.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return error(res, "VALIDATION_ERROR", "File is required", 400)
    }
    try {
      const data = await createBatchFromUpload(req.user.id, req.file)
      return success(res, data, "Batch created", 201)
    } catch (err) {
      return error(res, err.code || "UPLOAD_ERROR", err.message, err.status || 400)
    }
  })
)

batchesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await listBatches(req.user.id, req.query)
    return success(res, data)
  })
)

batchesRouter.get(
  "/:batchId",
  asyncHandler(async (req, res) => {
    try {
      const data = await getBatchDetail(Number(req.params.batchId), req.user.id)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

const actionHandler = (action) =>
  asyncHandler(async (req, res) => {
    try {
      const data = await updateBatchStatus(Number(req.params.batchId), req.user.id, action)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })

batchesRouter.post("/:batchId/start", actionHandler("start"))
batchesRouter.post("/:batchId/pause", actionHandler("pause"))
batchesRouter.post("/:batchId/resume", actionHandler("resume"))
batchesRouter.post("/:batchId/cancel", actionHandler("cancel"))

batchesRouter.get(
  "/:batchId/contacts",
  asyncHandler(async (req, res) => {
    try {
      const data = await listBatchContacts(Number(req.params.batchId), req.user.id, req.query)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

batchesRouter.get(
  "/:batchId/domains",
  asyncHandler(async (req, res) => {
    try {
      const { listBatchDomains } = require("../services/contact.service")
      const data = await listBatchDomains(Number(req.params.batchId), req.user.id, req.query)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

batchesRouter.post(
  "/:batchId/exports",
  asyncHandler(async (req, res) => {
    try {
      const data = await createExport(Number(req.params.batchId), req.user.id, req.body || {})
      return success(res, data, "Export queued", 201)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

batchesRouter.get(
  "/:batchId/report",
  asyncHandler(async (req, res) => {
    try {
      const data = await getBatchReport(Number(req.params.batchId), req.user.id)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

module.exports = { batchesRouter }
