const { db } = require("../db/knex")
const { env } = require("../config/env")
const { rankContact, selectTopContacts } = require("../utils/contactRanker")

const SOURCES = ["SNOV_PERSONAL", "SNOV_EMAILS", "APOLLO", "LINKEDIN", "DOMAIN_CONTACT"]

const mockDiscoverContacts = (domain, source, index) => {
  const titles = ["CEO", "Founder", "Marketing Director", "Sales Manager", "Support"]
  const title = titles[index % titles.length]
  const { priorityLevel, rankScore } = rankContact(title)
  const localPart = ["ceo", "founder", "marketing", "sales", "info"][index % 5]

  return {
    email: `${localPart}@${domain}`,
    full_name: `${title} Contact`,
    job_title: title,
    priority_level: priorityLevel,
    rank_score: rankScore,
    source,
  }
}

const processDomain = async (domainRow, batchId, minContacts) => {
  await db("domains").where({ id: domainRow.id }).update({
    status: "processing",
    processing_started_at: db.fn.now(),
  })

  const discovered = []
  let qualifying = 0

  for (const source of SOURCES) {
    if (qualifying >= minContacts) break

    const [attemptId] = await db("source_attempts").insert({
      domain_id: domainRow.id,
      source,
      status: "running",
      attempt_number: 1,
      started_at: db.fn.now(),
    })

    const extracted = []
    for (let i = 0; i < 2; i += 1) {
      extracted.push(mockDiscoverContacts(domainRow.domain, source, i))
    }

    qualifying += extracted.length
    discovered.push(...extracted.map((c) => ({ ...c, source_attempt_id: attemptId })))

    await db("source_attempts").where({ id: attemptId }).update({
      status: qualifying >= minContacts ? "success" : "insufficient_contacts",
      contacts_extracted: extracted.length,
      qualifying_contacts: extracted.length,
      completed_at: db.fn.now(),
    })

    await db("audit_logs").insert({
      batch_id: batchId,
      domain_id: domainRow.id,
      event_type: "SOURCE_ATTEMPT",
      source,
      message: `Source ${source} extracted ${extracted.length} contacts for ${domainRow.domain}`,
    })
  }

  const contactRows = discovered.map((c) => ({
    batch_id: batchId,
    domain_id: domainRow.id,
    source_attempt_id: c.source_attempt_id,
    store_url: domainRow.store_url,
    domain: domainRow.domain,
    company_name: domainRow.company_name || domainRow.domain,
    email: c.email,
    full_name: c.full_name,
    job_title: c.job_title,
    priority_level: c.priority_level,
    rank_score: c.rank_score,
    is_selected: false,
    discovered_at: db.fn.now(),
  }))

  if (contactRows.length) {
    await db("contacts").insert(contactRows)
  }

  const allContacts = await db("contacts")
    .select("id", "rank_score", "discovered_at")
    .where({ domain_id: domainRow.id })

  const selected = selectTopContacts(allContacts, minContacts)
  if (selected.length) {
    await db("contacts").whereIn("id", selected.map((c) => c.id)).update({ is_selected: true })
  }

  const finalStatus = contactRows.length ? "completed" : "no_contacts_found"
  await db("domains").where({ id: domainRow.id }).update({
    status: finalStatus,
    selected_contact_count: selected.length,
    processing_completed_at: db.fn.now(),
  })

  return { contactsFound: contactRows.length, selected: selected.length }
}

const processBatchDomains = async (batchId) => {
  const batch = await db("batches").where({ id: batchId }).first()
  if (!batch || batch.status === "cancelled") return

  const minContacts = env.MIN_CONTACTS_PER_DOMAIN || 2
  const domains = await db("domains")
    .select("id", "store_url", "domain", "company_name", "status")
    .where({ batch_id: batchId, status: "queued" })

  let processed = batch.processed_domains || 0
  let contactsFound = batch.contacts_found || 0
  let failed = batch.failed_domains || 0

  for (const domainRow of domains) {
    const current = await db("batches").where({ id: batchId }).first()
    if (!current || current.status === "paused" || current.status === "cancelled") break

    try {
      const result = await processDomain(domainRow, batchId, minContacts)
      processed += 1
      contactsFound += result.contactsFound
    } catch (err) {
      failed += 1
      processed += 1
      await db("domains").where({ id: domainRow.id }).update({
        status: "failed",
        error_message: err.message,
        processing_completed_at: db.fn.now(),
      })
    }

    await db("batches").where({ id: batchId }).update({
      processed_domains: processed,
      contacts_found: contactsFound,
      failed_domains: failed,
    })
  }

  const remaining = await db("domains")
    .where({ batch_id: batchId, status: "queued" })
    .count({ count: "*" })

  if (Number(remaining[0].count) === 0) {
    await db("batches").where({ id: batchId }).update({
      status: "completed",
      completed_at: db.fn.now(),
    })
  }
}

module.exports = { processBatchDomains, processDomain }
