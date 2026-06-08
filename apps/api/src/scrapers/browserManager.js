const path = require("path")
const fs = require("fs")
const { findMonorepoRoot } = require("@repo/config/loadEnv")
const { CaptchaDetectedError, ProxyFailedError } = require("./errors")

const ROOT = findMonorepoRoot(path.join(__dirname, "../../.."))
const SESSION_DIR = path.join(ROOT, "apps/api/.browser-sessions")

const sessions = new Map()

const ensureSessionDir = (source) => {
  const dir = path.join(SESSION_DIR, source)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

const buildProxy = (settings) => {
  const { env } = require("../config/env")
  if (!settings.proxy_enabled && !env.PROXY_ENABLED) return undefined

  const host = env.PROXY_HOST
  const port = env.PROXY_PORT
  if (!host || !port) return undefined

  const server = `http://${host}:${port}`
  const proxy = { server }
  if (env.PROXY_USERNAME) {
    proxy.username = env.PROXY_USERNAME
    proxy.password = env.PROXY_PASSWORD || ""
  }
  return proxy
}

const detectCaptcha = async (page) => {
  const captchaSelectors = [
    'iframe[src*="captcha"]',
    'iframe[src*="recaptcha"]',
    "#captcha",
    ".g-recaptcha",
    '[class*="captcha"]',
  ]

  for (const selector of captchaSelectors) {
    const count = await page.locator(selector).count()
    if (count > 0) {
      throw new CaptchaDetectedError()
    }
  }
}

const getBrowserContext = async (source, settings) => {
  if (sessions.has(source)) {
    return sessions.get(source)
  }

  const { chromium } = require("playwright")
  const userDataDir = ensureSessionDir(source)
  const headless = settings.headless !== false
  const proxy = buildProxy(settings)

  let context
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless,
      proxy,
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
  } catch (err) {
    if (proxy) {
      throw new ProxyFailedError(err.message)
    }
    throw err
  }

  const session = { context, loggedIn: false }
  sessions.set(source, session)
  return session
}

const closeAllBrowsers = async () => {
  for (const [, session] of sessions) {
    try {
      await session.context.close()
    } catch {
      // ignore shutdown errors
    }
  }
  sessions.clear()
}

module.exports = {
  getBrowserContext,
  detectCaptcha,
  closeAllBrowsers,
  SESSION_DIR,
}
