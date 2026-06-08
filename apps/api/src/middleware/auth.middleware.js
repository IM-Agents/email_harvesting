const jwt = require("jsonwebtoken")
const { env } = require("../config/env")
const { error } = require("../utils/apiResponse")

const authenticate = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return error(res, "UNAUTHORIZED", "Authentication required", 401)
  }

  const token = header.slice(7)
  try {
    const jwtSecret =
      env.JWT_SECRET ||
      (env.NODE_ENV === "production" ? null : "dev-change-me-to-at-least-32-random-chars")

    if (!jwtSecret) {
      return error(res, "SERVER_MISCONFIGURED", "JWT_SECRET is not configured", 500)
    }

    const payload = jwt.verify(token, jwtSecret)
    req.user = payload
    return next()
  } catch (err) {
    return error(res, "UNAUTHORIZED", "Invalid or expired token", 401)
  }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return error(res, "FORBIDDEN", "Insufficient permissions", 403)
  }
  return next()
}

module.exports = { authenticate, requireRole }
