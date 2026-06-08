const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { db } = require("../db/knex")
const { env } = require("../config/env")

const login = async (email, password) => {
  const user = await db("users")
    .select("id", "name", "email", "password_hash", "role")
    .where({ email })
    .first()

  if (!user) {
    const err = new Error("Invalid email or password")
    err.status = 401
    err.code = "INVALID_CREDENTIALS"
    throw err
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    const err = new Error("Invalid email or password")
    err.status = 401
    err.code = "INVALID_CREDENTIALS"
    throw err
  }

  const jwtSecret =
    env.JWT_SECRET ||
    (env.NODE_ENV === "production"
      ? null
      : "dev-change-me-to-at-least-32-random-chars")

  if (!jwtSecret) {
    const err = new Error("JWT_SECRET is not configured")
    err.status = 500
    err.code = "SERVER_MISCONFIGURED"
    throw err
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: "8h" }
  )

  return {
    access_token: accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

module.exports = { login }
