const { db } = require("../db/knex")

const listBatchContacts = async (batchId, userId, filters = {}) => {
  const batch = await db("batches").where({ id: batchId, user_id: userId }).first()
  if (!batch) {
    const err = new Error("Batch not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  const { page = 1, limit = 50, source, priority_level, domain, has_email } = filters
  const offset = (page - 1) * limit

  let query = db("contacts as c")
    .leftJoin("source_attempts as sa", "sa.id", "c.source_attempt_id")
    .select(
      "c.id",
      "c.store_url",
      "c.domain",
      "c.company_name",
      "c.email",
      "c.full_name as contact_name",
      "c.job_title",
      "sa.source",
      "c.priority_level",
      "c.discovered_at",
      "c.is_selected"
    )
    .where("c.batch_id", batchId)
    .orderBy("c.domain")
    .orderBy("c.rank_score")

  if (source) query = query.andWhere("sa.source", source)
  if (priority_level) query = query.andWhere("c.priority_level", priority_level)
  if (domain) query = query.andWhere("c.domain", "like", `%${domain}%`)
  if (has_email === "true") query = query.whereNotNull("c.email")
  if (has_email === "false") query = query.whereNull("c.email")

  const items = await query.limit(limit).offset(offset)
  const [{ count }] = await db("contacts").where({ batch_id: batchId }).count({ count: "*" })

  return { items, page, limit, total: Number(count) }
}

const listDomainContacts = async (domainId, userId) => {
  const domain = await db("domains as d")
    .join("batches as b", "b.id", "d.batch_id")
    .select("d.id", "d.batch_id", "d.domain", "d.store_url", "d.company_name", "d.status", "d.error_message")
    .where("d.id", domainId)
    .andWhere("b.user_id", userId)
    .first()

  if (!domain) {
    const err = new Error("Domain not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  const attempts = await db("source_attempts")
    .select("id", "source", "status", "contacts_extracted", "error_message", "started_at", "completed_at")
    .where({ domain_id: domainId })
    .orderBy("created_at")

  const contacts = await db("contacts as c")
    .leftJoin("source_attempts as sa", "sa.id", "c.source_attempt_id")
    .select(
      "c.id",
      "c.email",
      "c.full_name",
      "c.job_title",
      "sa.source",
      "c.priority_level",
      "c.is_selected",
      "c.discovered_at"
    )
    .where("c.domain_id", domainId)

  return { domain, source_attempts: attempts, contacts }
}

const listBatchDomains = async (batchId, userId, filters = {}) => {
  const batch = await db("batches").where({ id: batchId, user_id: userId }).first()
  if (!batch) {
    const err = new Error("Batch not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  const { page = 1, limit = 50, status, domain } = filters
  const offset = (page - 1) * limit

  let query = db("domains")
    .select("id", "store_url", "domain", "company_name", "status", "selected_contact_count", "error_message")
    .where({ batch_id: batchId })
    .orderBy("id")

  if (status) query = query.andWhere({ status })
  if (domain) query = query.andWhere("domain", "like", `%${domain}%`)

  const items = await query.limit(limit).offset(offset)
  const [{ count }] = await db("domains").where({ batch_id: batchId }).count({ count: "*" })

  return { items, page, limit, total: Number(count) }
}

const retryDomain = async (domainId, userId) => {
  const domain = await db("domains as d")
    .join("batches as b", "b.id", "d.batch_id")
    .select("d.id", "d.batch_id", "d.status")
    .where("d.id", domainId)
    .andWhere("b.user_id", userId)
    .first()

  if (!domain) {
    const err = new Error("Domain not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  await db("domains").where({ id: domainId }).update({ status: "queued", error_message: null })
  await db("batches").where({ id: domain.batch_id }).update({ status: "processing" })

  const { processBatchDomains } = require("./worker.service")
  processBatchDomains(domain.batch_id).catch(console.error)

  return { domain_id: domainId, status: "queued" }
}

module.exports = { listBatchContacts, listDomainContacts, listBatchDomains, retryDomain }
