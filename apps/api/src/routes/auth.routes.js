const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const { success, error } = require("../utils/apiResponse")
const { login } = require("../services/auth.service")

const authRouter = express.Router()

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return error(res, "VALIDATION_ERROR", "Email and password are required", 400)
    }
    try {
      const data = await login(email, password)
      return success(res, data)
    } catch (err) {
      return error(res, err.code || "AUTH_ERROR", err.message, err.status || 401)
    }
  })
)

module.exports = { authRouter }
