const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authenticate, requireRole } = require("../middleware/auth.middleware")
const { success } = require("../utils/apiResponse")
const { getSettings, updateSettings } = require("../services/settings.service")

const adminRouter = express.Router()

adminRouter.use(authenticate, requireRole("admin"))

adminRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const data = await getSettings()
    return success(res, data)
  })
)

adminRouter.patch(
  "/settings",
  asyncHandler(async (req, res) => {
    const data = await updateSettings(req.body || {})
    return success(res, data)
  })
)

module.exports = { adminRouter }
