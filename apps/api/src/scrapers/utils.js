const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const extractEmailsFromText = (text) => {
  if (!text) return []
  const matches = text.match(EMAIL_REGEX) || []
  return [...new Set(matches.map((e) => e.toLowerCase()))]
}

const domainFromEmail = (email) => {
  const parts = String(email).split("@")
  return parts.length > 1 ? parts[1].toLowerCase() : ""
}

const isEmailForDomain = (email, domain) => {
  const emailDomain = domainFromEmail(email)
  return emailDomain === domain.toLowerCase() || emailDomain.endsWith(`.${domain.toLowerCase()}`)
}

const deriveCompanyName = (domain) => {
  const root = domain.split(".")[0] || domain
  return root.charAt(0).toUpperCase() + root.slice(1)
}

const normalizeContact = (raw, source, domain) => {
  const email = raw.email ? String(raw.email).toLowerCase().trim() : null
  const fullName = raw.full_name || raw.fullName || raw.name || null
  const jobTitle = raw.job_title || raw.jobTitle || raw.title || null

  return {
    email,
    first_name: raw.first_name || raw.firstName || null,
    last_name: raw.last_name || raw.lastName || null,
    full_name: fullName,
    job_title: jobTitle,
    linkedin_url: raw.linkedin_url || raw.linkedinUrl || raw.linkedin_profile || null,
    company_name: raw.company_name || raw.companyName || deriveCompanyName(domain),
    source,
  }
}

module.exports = {
  EMAIL_REGEX,
  sleep,
  extractEmailsFromText,
  isEmailForDomain,
  deriveCompanyName,
  normalizeContact,
}
