const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authenticate } = require("../middleware/auth.middleware")
const { success, error } = require("../utils/apiResponse")
const { listBatchContacts } = require("../services/contact.service")

const contactsRouter = express.Router()

contactsRouter.use(authenticate)

contactsRouter.get(
  "/batch/:batchId",
  asyncHandler(async (req, res) => {
    try {
      const data = await listBatchContacts(Number(req.params.batchId), req.user.id, req.query)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

module.exports = { contactsRouter }
