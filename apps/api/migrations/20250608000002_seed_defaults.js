const bcrypt = require("bcryptjs")

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  const passwordHash = await bcrypt.hash("admin123", 10)
  const existing = await knex("users").where({ email: "admin@emailharvest.local" }).first()
  if (!existing) {
    await knex("users").insert({
      name: "Admin User",
      email: "admin@emailharvest.local",
      password_hash: passwordHash,
      role: "admin",
    })
  }

  const settings = [
    {
      key: "worker_count",
      value: JSON.stringify(10),
    },
    {
      key: "source_timeouts",
      value: JSON.stringify({ snov: 30000, apollo: 30000, linkedin: 30000, website: 20000 }),
    },
    {
      key: "retry_backoff_seconds",
      value: JSON.stringify([30, 60, 120]),
    },
    {
      key: "proxy_enabled",
      value: JSON.stringify(false),
    },
    {
      key: "headless",
      value: JSON.stringify(true),
    },
  ]

  for (const setting of settings) {
    const row = await knex("app_settings").where({ key: setting.key }).first()
    if (!row) {
      await knex("app_settings").insert(setting)
    }
  }
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex("users").where({ email: "admin@emailharvest.local" }).del()
  await knex("app_settings").whereIn("key", [
    "worker_count",
    "source_timeouts",
    "retry_backoff_seconds",
    "proxy_enabled",
    "headless",
  ]).del()
}
