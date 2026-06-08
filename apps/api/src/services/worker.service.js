const { db } = require("../db/knex")
const { env } = require("../config/env")
const { getSettings } = require("./settings.service")
const { selectTopContacts } = require("../utils/contactRanker")
const { discoverContactsForDomain } = require("../scrapers/discoveryOrchestrator")

const pLimit = require("p-limit")

const persistSourceAttempt = async (domainId, attempt, attemptNumber) => {
  const [attemptId] = await db("source_attempts").insert({
    domain_id: domainId,
    source: attempt.source,
    status: attempt.status,
    attempt_number: attemptNumber,
    contacts_extracted: attempt.contacts_extracted,
    qualifying_contacts: attempt.qualifying_contacts,
    error_message: attempt.error_message,
    started_at: db.fn.now(),
    completed_at: db.fn.now(),
  })
  return attemptId
}

const processDomain = async (domainRow, batchId, minContacts, settings) => {
  await db("contacts").where({ domain_id: domainRow.id }).del()
  await db("source_attempts").where({ domain_id: domainRow.id }).del()

  await db("domains").where({ id: domainRow.id }).update({
    status: "processing",
    processing_started_at: db.fn.now(),
    error_message: null,
  })

  const { contacts, attempts } = await discoverContactsForDomain(
    domainRow.domain,
    minContacts,
    settings
  )

  const contactRows = []

  for (const attempt of attempts) {
    const attemptId = await persistSourceAttempt(domainRow.id, attempt, 1)

    await db("audit_logs").insert({
      batch_id: batchId,
      domain_id: domainRow.id,
      event_type: "SOURCE_ATTEMPT",
      source: attempt.source,
      message: attempt.error_message
        ? `Source ${attempt.source} failed: ${attempt.error_message}`
        : `Source ${attempt.source} extracted ${attempt.contacts_extracted} contacts for ${domainRow.domain}`,
      details: JSON.stringify({ status: attempt.status }),
    })

    for (const c of attempt.contacts || []) {
      contactRows.push({
        batch_id: batchId,
        domain_id: domainRow.id,
        source_attempt_id: attemptId,
        store_url: domainRow.store_url,
        domain: domainRow.domain,
        company_name: c.company_name || domainRow.company_name || domainRow.domain,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        full_name: c.full_name,
        job_title: c.job_title,
        linkedin_url: c.linkedin_url,
        priority_level: c.priority_level,
        rank_score: c.rank_score,
        is_selected: false,
        discovered_at: db.fn.now(),
      })
    }
  }

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
  const primaryError = attempts.find((a) => a.error_message)?.error_message || null

  await db("domains").where({ id: domainRow.id }).update({
    status: finalStatus,
    selected_contact_count: selected.length,
    processing_completed_at: db.fn.now(),
    error_message: contactRows.length ? null : primaryError,
  })

  return { contactsFound: contactRows.length, selected: selected.length }
}

const processBatchDomains = async (batchId) => {
  const batch = await db("batches").where({ id: batchId }).first()
  if (!batch || batch.status === "cancelled") return

  const settings = await getSettings()
  const minContacts = env.MIN_CONTACTS_PER_DOMAIN || 2
  const workerCount = Number(settings.worker_count) || env.WORKER_COUNT || 10

  const domains = await db("domains")
    .select("id", "store_url", "domain", "company_name", "status")
    .where({ batch_id: batchId, status: "queued" })

  const limit = pLimit(workerCount)

  await Promise.all(
    domains.map((domainRow) =>
      limit(async () => {
        const current = await db("batches").where({ id: batchId }).first()
        if (!current || current.status === "paused" || current.status === "cancelled") {
          return
        }

        try {
          const result = await processDomain(domainRow, batchId, minContacts, settings)
          await db("batches").where({ id: batchId }).update({
            processed_domains: db.raw("processed_domains + 1"),
            contacts_found: db.raw(`contacts_found + ${Number(result.contactsFound) || 0}`),
          })
        } catch (err) {
          await db("domains").where({ id: domainRow.id }).update({
            status: "failed",
            error_message: err.message,
            processing_completed_at: db.fn.now(),
          })
          await db("batches").where({ id: batchId }).update({
            processed_domains: db.raw("processed_domains + 1"),
            failed_domains: db.raw("failed_domains + 1"),
          })
        }
      })
    )
  )

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
