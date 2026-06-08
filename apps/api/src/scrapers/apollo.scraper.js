const { getBrowserContext, detectCaptcha } = require("./browserManager")
const { LoginFailedError, PageStructureChangedError } = require("./errors")
const { normalizeContact, extractEmailsFromText, deriveCompanyName } = require("./utils")

const LOGIN_URL = "https://app.apollo.io/#/login"
const APP_PATTERN = /apollo\.io\/#\/(home|people|companies|search)/i

const ensureLoggedIn = async (page, settings) => {
  const { env } = require("../config/env")
  const email = env.APOLLO_EMAIL
  const password = env.APOLLO_PASSWORD

  if (!email || !password) {
    throw new LoginFailedError("APOLLO_EMAIL and APOLLO_PASSWORD are required")
  }

  const session = await getBrowserContext("apollo", settings)
  if (session.loggedIn) return page

  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: settings.timeout })
  await detectCaptcha(page)

  const emailInput = page.locator('input[type="email"], input[name="email"]')
  const passwordInput = page.locator('input[type="password"]')

  if ((await emailInput.count()) === 0) {
    if (APP_PATTERN.test(page.url())) {
      session.loggedIn = true
      return page
    }
    throw new PageStructureChangedError("Apollo login form not found")
  }

  await emailInput.first().fill(email)
  await passwordInput.first().fill(password)
  await page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first().click()

  try {
    await page.waitForURL(APP_PATTERN, { timeout: settings.timeout })
  } catch {
    await detectCaptcha(page)
    throw new LoginFailedError("Apollo login failed")
  }

  session.loggedIn = true
  return page
}

const resolveCompanyName = async (page, domain) => {
  const derived = deriveCompanyName(domain)
  try {
    await page.goto(`https://${domain}`, { waitUntil: "domcontentloaded", timeout: 15000 })
    const meta = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:title"]')?.content
      const title = document.title
      const schema = document.querySelector('script[type="application/ld+json"]')?.textContent
      let orgName = null
      if (schema) {
        try {
          const data = JSON.parse(schema)
          orgName = data.name || data["@graph"]?.find((n) => n["@type"] === "Organization")?.name
        } catch {
          // ignore invalid JSON-LD
        }
      }
      return { og, title, orgName }
    })
    return meta.orgName || meta.og || meta.title?.split("|")[0]?.trim() || derived
  } catch {
    return derived
  }
}

const extractPeople = async (page, domain, companyName) => {
  const rows = await page.evaluate(() => {
    const results = []
    const selectors = [
      "table tbody tr",
      '[class*="zp_"]',
      '[data-cy*="person"]',
      '[class*="person"]',
      '[class*="contact"]',
    ]
    const seen = new Set()

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((el) => {
        const text = el.innerText || ""
        if (!text.trim() || seen.has(text)) return
        seen.add(text)

        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
        const email = emailMatch ? emailMatch[0] : null
        const name = lines[0] || null
        const title = lines.find((l) => l !== name && !l.includes("@") && l.length < 80) || null

        if (email || name) {
          results.push({ email, full_name: name, job_title: title })
        }
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
    .filter((r) => r.email || r.full_name)
    .map((r) =>
      normalizeContact({ ...r, company_name: companyName }, "APOLLO", domain)
    )
}

const scrapeApollo = async (domain, settings) => {
  const session = await getBrowserContext("apollo", settings)
  const page = session.context.pages()[0] || (await session.context.newPage())

  await ensureLoggedIn(page, settings)

  const companyName = await resolveCompanyName(page, domain)
  const searchUrl = `https://app.apollo.io/#/people?organizationName=${encodeURIComponent(companyName)}&qOrganizationName=${encodeURIComponent(companyName)}`

  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: settings.timeout })
  await detectCaptcha(page)
  await page.waitForTimeout(3000)

  return extractPeople(page, domain, companyName)
}

module.exports = { scrapeApollo, ensureLoggedIn }
