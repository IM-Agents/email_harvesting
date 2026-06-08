const path = require("path")
const Joi = require("joi")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

loadEnv({ rootDir: findMonorepoRoot(path.join(__dirname, "../../..")), appName: "web" })

const { env: sharedEnv } = require("@repo/config/env")

const webEnvSchema = Joi.object({}).unknown(true)

const { value: webEnv, error } = webEnvSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
  stripUnknown: false,
})

if (error) {
  throw new Error(`Invalid web env: ${error.message}`)
}

const env = { ...sharedEnv, ...webEnv }

module.exports = { env }
