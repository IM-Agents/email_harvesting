const { scrapePersonal, scrapeEmails } = require("./snov.scraper")
const { scrapeApollo } = require("./apollo.scraper")
const { scrapeLinkedIn } = require("./linkedin.scraper")
const { crawlWebsite } = require("./websiteCrawler")
const { withRetry } = require("./retry")
const { rankContact } = require("../utils/contactRanker")
const { ScraperError } = require("./errors")

const SOURCE_RUNNERS = {
  SNOV_PERSONAL: scrapePersonal,
  SNOV_EMAILS: scrapeEmails,
  APOLLO: scrapeApollo,
  LINKEDIN: scrapeLinkedIn,
  DOMAIN_CONTACT: crawlWebsite,
}

const SOURCE_ORDER = ["SNOV_PERSONAL", "SNOV_EMAILS", "APOLLO", "LINKEDIN", "DOMAIN_CONTACT"]

const rankGenericEmail = (email) => {
  const local = String(email).split("@")[0]?.toLowerCase() || ""
  const genericOrder = ["info", "contact", "support", "sales", "hello", "admin", "team"]
  const idx = genericOrder.indexOf(local)
  if (idx >= 0) {
    return { priorityLevel: 4, rankScore: 100 + idx * 5 }
  }
  return rankContact("")
}

const enrichContact = (contact) => {
  let { priorityLevel, rankScore } = rankContact(contact.job_title || "")

  if (contact.source === "DOMAIN_CONTACT" && contact.email) {
    const generic = rankGenericEmail(contact.email)
    priorityLevel = generic.priorityLevel
    rankScore = generic.rankScore
  }

  return { ...contact, priority_level: priorityLevel, rank_score: rankScore }
}

const runSource = async (source, domain, settings) => {
  const runner = SOURCE_RUNNERS[source]
  if (!runner) {
    throw new ScraperError(`Unknown source: ${source}`)
  }

  const timeoutKey = source.startsWith("SNOV")
    ? "snov"
    : source === "APOLLO"
      ? "apollo"
      : source === "LINKEDIN"
        ? "linkedin"
        : "website"

  const sourceSettings = {
    ...settings,
    timeout: settings.source_timeouts?.[timeoutKey] || settings.timeout || 30000,
  }

  const backoff = settings.retry_backoff_seconds || [30, 60, 120]

  const rawContacts = await withRetry(
    async (attemptNumber) => {
      const result = await runner(domain, sourceSettings)
      return { result, attemptNumber }
    },
    { maxRetries: 3, backoffSeconds: backoff }
  )

  return rawContacts.result.map(enrichContact)
}

const discoverContactsForDomain = async (domain, minContacts, settings) => {
  const attempts = []
  const allContacts = []
  let qualifying = 0

  for (const source of SOURCE_ORDER) {
    if (qualifying >= minContacts) break

    let status = "success"
    let errorMessage = null
    let extracted = []

    try {
      extracted = await runSource(source, domain, settings)
      const withEmail = extracted.filter((c) => c.email)
      qualifying += withEmail.length
      allContacts.push(...extracted)

      if (withEmail.length === 0) {
        status = "insufficient_contacts"
      } else if (qualifying < minContacts) {
        status = "insufficient_contacts"
      }
    } catch (err) {
      status = err.status || "failed"
      errorMessage = err.message
      if (err instanceof ScraperError) {
        status = err.status
      }
    }

    attempts.push({
      source,
      status,
      contacts_extracted: extracted.length,
      qualifying_contacts: extracted.filter((c) => c.email).length,
      error_message: errorMessage,
      contacts: extracted,
    })
  }

  return { contacts: allContacts, attempts, qualifying }
}

module.exports = { discoverContactsForDomain, SOURCE_ORDER }
