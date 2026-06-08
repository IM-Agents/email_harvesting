const path = require("path")
const { execFile } = require("child_process")
const { promisify } = require("util")
const { findMonorepoRoot } = require("@repo/config/loadEnv")
const { normalizeContact } = require("./utils")
const { TimeoutError } = require("./errors")

const execFileAsync = promisify(execFile)
const ROOT = findMonorepoRoot(path.join(__dirname, "../../.."))
const CRAWLER_SCRIPT = path.join(ROOT, "apps/crawler/crawl_domain.py")

const crawlViaHttp = async (domain, maxPages, timeout) => {
  const { env } = require("../config/env")
  const baseUrl = env.CRAWLER_SERVICE_URL
  if (!baseUrl) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, max_pages: maxPages }),
      signal: controller.signal,
    })
    const parsed = await response.json()
    if (!response.ok || !parsed.success) {
      throw new Error(parsed.error || "Crawler service request failed")
    }
    return parsed
  } finally {
    clearTimeout(timer)
  }
}

const crawlWebsite = async (domain, settings) => {
  const { env } = require("../config/env")
  const pythonBin = env.CRAWLER_PYTHON || "python"
  const maxPages = env.MAX_PAGES_PER_DOMAIN || 10
  const timeout = settings.timeout || 60000

  try {
    const httpResult = await crawlViaHttp(domain, maxPages, timeout)
    if (httpResult) {
      return (httpResult.contacts || []).map((c) => normalizeContact(c, "DOMAIN_CONTACT", domain))
    }

    const { stdout } = await execFileAsync(
      pythonBin,
      [CRAWLER_SCRIPT, domain, String(maxPages)],
      {
        timeout,
        cwd: path.join(ROOT, "apps/crawler"),
        maxBuffer: 10 * 1024 * 1024,
      }
    )

    const parsed = JSON.parse(stdout.trim())
    if (!parsed.success) {
      throw new Error(parsed.error || "Website crawl failed")
    }

    return (parsed.contacts || []).map((c) => normalizeContact(c, "DOMAIN_CONTACT", domain))
  } catch (err) {
    if (err.killed || /ETIMEDOUT|timed out/i.test(err.message)) {
      throw new TimeoutError(`Website crawl timed out for ${domain}`)
    }
    throw err
  }
}

module.exports = { crawlWebsite }
