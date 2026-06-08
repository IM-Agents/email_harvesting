const { db } = require("../db/knex")
const { env } = require("../config/env")

const getSettings = async () => {
  const rows = await db("app_settings").select("key", "value")
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return {
    worker_count: map.worker_count ?? env.WORKER_COUNT,
    source_timeouts: map.source_timeouts ?? {
      snov: env.BROWSER_TIMEOUT,
      apollo: env.BROWSER_TIMEOUT,
      linkedin: env.BROWSER_TIMEOUT,
      website: 20000,
    },
    retry_backoff_seconds: map.retry_backoff_seconds ?? env.RETRY_BACKOFF_SECONDS.split(",").map(Number),
    proxy_enabled: map.proxy_enabled ?? env.PROXY_ENABLED,
    headless: map.headless ?? env.HEADLESS,
  }
}

const updateSettings = async (payload) => {
  const entries = [
    ["worker_count", payload.worker_count],
    ["source_timeouts", payload.source_timeouts],
    ["retry_backoff_seconds", payload.retry_backoff_seconds],
    ["proxy_enabled", payload.proxy_enabled],
    ["headless", payload.headless],
  ].filter(([, value]) => value !== undefined)

  for (const [key, value] of entries) {
    const serialized = JSON.stringify(value)
    const existing = await db("app_settings").where({ key }).first()
    if (existing) {
      await db("app_settings").where({ key }).update({ value: serialized, updated_at: db.fn.now() })
    } else {
      await db("app_settings").insert({ key, value: serialized })
    }
  }

  return getSettings()
}

module.exports = { getSettings, updateSettings }
