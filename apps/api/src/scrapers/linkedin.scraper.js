const { getBrowserContext, detectCaptcha } = require("./browserManager")
const { LoginFailedError, PageStructureChangedError } = require("./errors")
const { normalizeContact, deriveCompanyName } = require("./utils")

const LOGIN_URL = "https://www.linkedin.com/login"
const FEED_PATTERN = /linkedin\.com\/(feed|search|company)/i

const ROLE_SEARCHES = [
  ["CEO", "Founder", "Owner", "President", "Director", "Managing Director"],
  ["Marketing Manager", "Head of Marketing", "VP Marketing", "Growth Manager"],
  ["Sales Manager", "Operations Manager", "CTO", "Head of Operations", "Head of Sales"],
]

const ensureLoggedIn = async (page, settings) => {
  const { env } = require("../config/env")
  const email = env.LINKEDIN_EMAIL
  const password = env.LINKEDIN_PASSWORD

  if (!email || !password) {
    throw new LoginFailedError("LINKEDIN_EMAIL and LINKEDIN_PASSWORD are required")
  }

  const session = await getBrowserContext("linkedin", settings)
  if (session.loggedIn) return page

  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: settings.timeout })
  await detectCaptcha(page)

  await page.locator("#username, input[name='session_key']").first().fill(email)
  await page.locator("#password, input[name='session_password']").first().fill(password)
  await page.locator('button[type="submit"]').first().click()

  try {
    await page.waitForURL(FEED_PATTERN, { timeout: settings.timeout })
  } catch {
    await detectCaptcha(page)
    throw new LoginFailedError("LinkedIn login failed")
  }

  session.loggedIn = true
  return page
}

const extractSearchResults = async (page, domain) => {
  const people = await page.evaluate(() => {
    const results = []
    const cards = document.querySelectorAll(
      ".reusable-search__result-container, .entity-result, li[class*='search-result']"
    )

    cards.forEach((card) => {
      const text = card.innerText || ""
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
      if (!lines.length) return

      const name = lines[0]
      const title = lines[1] || null
      const link = card.querySelector("a[href*='/in/']")?.href || null

      results.push({
        full_name: name,
        job_title: title,
        linkedin_url: link,
        email: null,
      })
    })
    return results
  })

  const companyName = deriveCompanyName(domain)
  return people.map((p) =>
    normalizeContact({ ...p, company_name: companyName }, "LINKEDIN", domain)
  )
}

const scrapeLinkedIn = async (domain, settings) => {
  const session = await getBrowserContext("linkedin", settings)
  const page = session.context.pages()[0] || (await session.context.newPage())

  await ensureLoggedIn(page, settings)

  const companyName = deriveCompanyName(domain)
  const collected = []
  const seen = new Set()

  for (const roleGroup of ROLE_SEARCHES) {
    for (const role of roleGroup) {
      const query = `${role} ${companyName}`
      const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: settings.timeout })
      await detectCaptcha(page)
      await page.waitForTimeout(2000)

      const batch = await extractSearchResults(page, domain)
      for (const contact of batch) {
        const key = contact.linkedin_url || contact.full_name
        if (key && !seen.has(key)) {
          seen.add(key)
          collected.push(contact)
        }
      }

      if (collected.length >= 5) break
    }
    if (collected.length >= 5) break
  }

  return collected
}

module.exports = { scrapeLinkedIn, ensureLoggedIn }
