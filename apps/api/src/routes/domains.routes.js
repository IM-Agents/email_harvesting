const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authenticate } = require("../middleware/auth.middleware")
const { success, error } = require("../utils/apiResponse")
const { listDomainContacts, listBatchDomains, retryDomain } = require("../services/contact.service")

const domainsRouter = express.Router()

domainsRouter.use(authenticate)

domainsRouter.get(
  "/batch/:batchId",
  asyncHandler(async (req, res) => {
    try {
      const data = await listBatchDomains(Number(req.params.batchId), req.user.id, req.query)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

domainsRouter.get(
  "/:domainId",
  asyncHandler(async (req, res) => {
    try {
      const data = await listDomainContacts(Number(req.params.domainId), req.user.id)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

domainsRouter.post(
  "/:domainId/retry",
  asyncHandler(async (req, res) => {
    try {
      const data = await retryDomain(Number(req.params.domainId), req.user.id)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "ERROR", err.message, err.status || 500)
    }
  })
)

module.exports = { domainsRouter }
