const fs = require("fs")
const path = require("path")
const { db } = require("../db/knex")
const { parseSpreadsheet } = require("./fileParser.service")
const { processBatchDomains } = require("./worker.service")

const UPLOAD_DIR = path.join(__dirname, "../../uploads")

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

const createBatchFromUpload = async (userId, file) => {
  ensureUploadDir()
  const storageKey = `${Date.now()}-${file.originalname}`
  const dest = path.join(UPLOAD_DIR, storageKey)
  fs.renameSync(file.path, dest)

  const parsed = parseSpreadsheet(dest, file.originalname)

  const [batchId] = await db("batches").insert({
    user_id: userId,
    original_file_name: file.originalname,
    file_storage_key: storageKey,
    status: "queued",
    total_rows: parsed.totalRows,
    valid_domains: parsed.validDomains,
    invalid_rows: parsed.invalidRows,
  })

  if (parsed.rows.length) {
    await db("batch_rows").insert(
      parsed.rows.map((row) => ({
        batch_id: batchId,
        row_number: row.rowNumber,
        store_url: row.storeUrl,
        normalized_domain: row.normalizedDomain,
        validation_status: row.validationStatus,
        validation_error: row.validationError,
      }))
    )
  }

  const validDomains = parsed.rows.filter((r) => r.validationStatus === "valid")
  if (validDomains.length) {
    await db("domains").insert(
      validDomains.map((row) => ({
        batch_id: batchId,
        store_url: row.storeUrl,
        domain: row.normalizedDomain,
        status: "queued",
      }))
    )
  }

  await db("audit_logs").insert({
    batch_id: batchId,
    event_type: "BATCH_UPLOADED",
    message: `Batch ${batchId} uploaded with ${parsed.validDomains} valid domains`,
    details: JSON.stringify({ invalid_rows: parsed.invalidRows }),
  })

  return {
    batch_id: batchId,
    status: "queued",
    total_rows: parsed.totalRows,
    valid_domains: parsed.validDomains,
    invalid_rows: parsed.invalidRows,
  }
}

const listBatches = async (userId, { page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit
  let query = db("batches")
    .select(
      "id",
      "status",
      "original_file_name",
      "total_rows",
      "valid_domains",
      "invalid_rows",
      "processed_domains",
      "contacts_found",
      "failed_domains",
      "created_at",
      "completed_at"
    )
    .where({ user_id: userId })
    .orderBy("created_at", "desc")

  if (status) query = query.andWhere({ status })

  const rows = await query.limit(limit).offset(offset)
  const [{ count }] = await db("batches").where({ user_id: userId }).count({ count: "*" })
  return { items: rows, page, limit, total: Number(count) }
}

const getBatchDetail = async (batchId, userId) => {
  const batch = await db("batches")
    .select(
      "id",
      "status",
      "original_file_name",
      "total_rows",
      "valid_domains",
      "invalid_rows",
      "processed_domains",
      "contacts_found",
      "failed_domains",
      "started_at",
      "completed_at",
      "created_at"
    )
    .where({ id: batchId, user_id: userId })
    .first()

  if (!batch) {
    const err = new Error("Batch not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  const sourceBreakdown = await db("contacts as c")
    .leftJoin("source_attempts as sa", "sa.id", "c.source_attempt_id")
    .select("sa.source")
    .count("c.id as count")
    .where("c.batch_id", batchId)
    .groupBy("sa.source")

  return { ...batch, batch_id: batch.id, contacts_per_source: sourceBreakdown }
}

const updateBatchStatus = async (batchId, userId, status) => {
  const batch = await db("batches").where({ id: batchId, user_id: userId }).first()
  if (!batch) {
    const err = new Error("Batch not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  const allowed = {
    start: { from: ["queued", "paused"], to: "processing" },
    pause: { from: ["processing"], to: "paused" },
    resume: { from: ["paused"], to: "processing" },
    cancel: { from: ["queued", "processing", "paused"], to: "cancelled" },
  }

  const action = allowed[status]
  if (!action || !action.from.includes(batch.status)) {
    const err = new Error(`Cannot ${status} batch in status ${batch.status}`)
    err.status = 400
    err.code = "INVALID_STATE"
    throw err
  }

  const updates = { status: action.to }
  if (action.to === "processing" && !batch.started_at) {
    updates.started_at = db.fn.now()
  }
  if (action.to === "cancelled" || action.to === "completed") {
    updates.completed_at = db.fn.now()
  }

  await db("batches").where({ id: batchId }).update(updates)

  if (action.to === "processing") {
    processBatchDomains(batchId).catch((err) => {
      console.error(`Batch ${batchId} processing error:`, err.message)
    })
  }

  return { batch_id: batchId, status: action.to }
}

const getDashboardMetrics = async (userId) => {
  const batches = await db("batches").where({ user_id: userId })
  const totalBatches = batches.length
  const processingBatches = batches.filter((b) => b.status === "processing").length
  const completedBatches = batches.filter((b) => b.status === "completed").length
  const failedBatches = batches.filter((b) => b.status === "failed").length
  const contactsDiscovered = batches.reduce((sum, b) => sum + (b.contacts_found || 0), 0)
  const validDomains = batches.reduce((sum, b) => sum + (b.valid_domains || 0), 0)
  const discoveryRate = validDomains > 0
    ? Math.round((contactsDiscovered / validDomains) * 100) / 100
    : 0

  return {
    total_batches: totalBatches,
    processing_batches: processingBatches,
    completed_batches: completedBatches,
    failed_batches: failedBatches,
    contacts_discovered: contactsDiscovered,
    average_discovery_rate: discoveryRate,
  }
}

module.exports = {
  createBatchFromUpload,
  listBatches,
  getBatchDetail,
  updateBatchStatus,
  getDashboardMetrics,
  UPLOAD_DIR,
}
