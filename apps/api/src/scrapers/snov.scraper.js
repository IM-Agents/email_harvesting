const { getBrowserContext, detectCaptcha } = require("./browserManager")
const { LoginFailedError, PageStructureChangedError, TimeoutError } = require("./errors")
const { normalizeContact, extractEmailsFromText } = require("./utils")

const LOGIN_URL = "https://app.snov.io/login"
const DASHBOARD_PATTERN = /domain-search|dashboard|prospects|home/i

const ensureLoggedIn = async (page, settings) => {
  const { env } = require("../config/env")
  const email = env.SNOV_EMAIL
  const password = env.SNOV_PASSWORD

  if (!email || !password) {
    throw new LoginFailedError("SNOV_EMAIL and SNOV_PASSWORD are required")
  }

  const session = await getBrowserContext("snov", settings)
  if (session.loggedIn) {
    return page
  }

  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: settings.timeout })
  await detectCaptcha(page)

  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="login"]')
  const passwordInput = page.locator('input[type="password"]')

  if ((await emailInput.count()) === 0 || (await passwordInput.count()) === 0) {
    const url = page.url()
    if (DASHBOARD_PATTERN.test(url)) {
      session.loggedIn = true
      return page
    }
    throw new PageStructureChangedError("Snov.io login form not found")
  }

  await emailInput.first().fill(email)
  await passwordInput.first().fill(password)
  await page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first().click()

  try {
    await page.waitForURL(DASHBOARD_PATTERN, { timeout: settings.timeout })
  } catch {
    await detectCaptcha(page)
    throw new LoginFailedError("Snov.io login did not reach dashboard")
  }

  session.loggedIn = true
  return page
}

const extractContactsFromPage = async (page, domain, source) => {
  const rows = await page.evaluate(() => {
    const results = []
    const rowSelectors = [
      "table tbody tr",
      '[class*="prospect"]',
      '[class*="Prospect"]',
      '[data-testid*="prospect"]',
      '[class*="contact-row"]',
      "li[class*='result']",
    ]

    const seen = new Set()
    for (const selector of rowSelectors) {
      document.querySelectorAll(selector).forEach((el) => {
        const text = el.innerText || ""
        if (!text.trim() || seen.has(text)) return
        seen.add(text)

        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
        if (!emailMatch) return

        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
        const email = emailMatch[0]
        const nameLine = lines.find((l) => !l.includes("@")) || ""
        const titleLine = lines.find((l) => l !== email && l !== nameLine && l.length < 80) || ""

        results.push({
          email,
          full_name: nameLine || null,
          job_title: titleLine || null,
        })
      })
    }
    return results
  })

  const bodyEmails = extractEmailsFromText(await page.locator("body").innerText())
  const merged = [...rows]

  for (const email of bodyEmails) {
    if (!merged.some((r) => r.email === email)) {
      merged.push({ email, full_name: null, job_title: null })
    }
  }

  return merged
    .filter((r) => r.email && r.email.includes(`@${domain}`))
    .map((r) => normalizeContact(r, source, domain))
}

const scrapeTab = async (domain, tab, source, settings) => {
  const session = await getBrowserContext("snov", settings)
  const page = session.context.pages()[0] || (await session.context.newPage())

  await ensureLoggedIn(page, settings)

  const url = `https://app.snov.io/domain-search?name=${encodeURIComponent(domain)}&tab=${tab}`
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: settings.timeout })
  await detectCaptcha(page)

  await page.waitForTimeout(2000)

  try {
    await page.waitForSelector("table tbody tr, [class*='prospect'], [class*='Prospect']", {
      timeout: Math.min(settings.timeout, 15000),
    })
  } catch {
    // page may have zero results — still try body extraction
  }

  return extractContactsFromPage(page, domain, source)
}

const scrapePersonal = async (domain, settings) => scrapeTab(domain, "personal", "SNOV_PERSONAL", settings)

const scrapeEmails = async (domain, settings) => scrapeTab(domain, "emails", "SNOV_EMAILS", settings)

module.exports = { scrapePersonal, scrapeEmails, ensureLoggedIn }
