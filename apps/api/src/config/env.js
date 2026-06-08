const path = require("path")
const Joi = require("joi")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

loadEnv({ rootDir: findMonorepoRoot(path.join(__dirname, "../../..")), appName: "api" })

const { env: sharedEnv } = require("@repo/config/env")

const appEnvSchema = Joi.object({
  CORS_ORIGIN: Joi.string().default("*"),
}).unknown(true)

const ensureJwtSecret = (mergedEnv) => {
  const secret = mergedEnv.JWT_SECRET
  const isProduction = mergedEnv.NODE_ENV === "production"
  if (isProduction && (!secret || secret.length < 32)) {
    throw new Error("JWT_SECRET must be set to at least 32 characters in production")
  }
}

const { value: appEnv, error } = appEnvSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
  stripUnknown: false,
})

if (error) {
  throw new Error(`Invalid api env: ${error.message}`)
}

const env = { ...sharedEnv, ...appEnv }

ensureJwtSecret(env)

module.exports = { env }
