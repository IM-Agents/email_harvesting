const Joi = require("joi")

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  APP_ENV: Joi.string().default("development"),
  APP_URL: Joi.string().uri().allow("").default("http://localhost:8080"),

  PORT: Joi.number().default(8080),
  PUBLIC_PATH: Joi.string().default("/"),
  WEB_PORT: Joi.number().default(3001),
  API_PORT: Joi.number().default(4000),
  API_BASE_URL: Joi.string().default("http://localhost:4000"),

  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().default("root"),
  DB_PASSWORD: Joi.string().allow("").default(""),
  DB_NAME: Joi.string().default("email_harvesting_app"),

  SNOV_EMAIL: Joi.string().email().allow("").optional(),
  SNOV_PASSWORD: Joi.string().allow("").optional(),
  APOLLO_EMAIL: Joi.string().email().allow("").optional(),
  APOLLO_PASSWORD: Joi.string().allow("").optional(),
  LINKEDIN_EMAIL: Joi.string().email().allow("").optional(),
  LINKEDIN_PASSWORD: Joi.string().allow("").optional(),

  HEADLESS: Joi.boolean().truthy("true").falsy("false").default(true),
  BROWSER_TIMEOUT: Joi.number().default(30000),

  PROXY_ENABLED: Joi.boolean().truthy("true").falsy("false").default(false),
  PROXY_HOST: Joi.string().allow("").optional(),
  PROXY_PORT: Joi.number().empty("").optional(),
  PROXY_USERNAME: Joi.string().allow("").optional(),
  PROXY_PASSWORD: Joi.string().allow("").optional(),

  REDIS_URL: Joi.string().uri().allow("").optional(),
  S3_ENDPOINT: Joi.string().allow("").optional(),
  S3_BUCKET: Joi.string().allow("").optional(),
  S3_ACCESS_KEY_ID: Joi.string().allow("").optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().allow("").optional(),

  JWT_SECRET: Joi.string().min(16).allow("").optional(),
  WORKER_COUNT: Joi.number().default(10),
  MAX_PAGES_PER_DOMAIN: Joi.number().default(10),
  MIN_CONTACTS_PER_DOMAIN: Joi.number().default(2),
  RETRY_BACKOFF_SECONDS: Joi.string().default("30,60,120"),
}).unknown(true)

const { value: env, error } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
  stripUnknown: false,
})

if (error) {
  throw new Error(`Invalid environment: ${error.message}`)
}

module.exports = { env, envSchema }
