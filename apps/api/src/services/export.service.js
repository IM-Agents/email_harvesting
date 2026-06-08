const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx")
const { db } = require("../db/knex")
const { UPLOAD_DIR } = require("./batch.service")

const EXPORT_DIR = path.join(UPLOAD_DIR, "exports")

const ensureExportDir = () => {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true })
  }
}

const getExportRows = async (batchId) => {
  return db("contacts as c")
    .leftJoin("source_attempts as sa", "sa.id", "c.source_attempt_id")
    .select(
      "c.store_url",
      "c.domain",
      "c.company_name",
      "c.email",
      "c.full_name as contact_name",
      "c.job_title",
      "sa.source",
      "c.priority_level",
      "c.discovered_at"
    )
    .where("c.batch_id", batchId)
    .andWhere("c.is_selected", true)
    .orderBy("c.domain")
    .orderBy("c.rank_score")
}

const generateExportFile = async (exportId, batchId, format) => {
  ensureExportDir()
  const rows = await getExportRows(batchId)

  const fileName = `batch-${batchId}-export.${format}`
  const storageKey = path.join("exports", fileName)
  const filePath = path.join(UPLOAD_DIR, storageKey)

  if (format === "csv") {
    const headers = Object.keys(rows[0] || {
      store_url: "",
      domain: "",
      company_name: "",
      email: "",
      contact_name: "",
      job_title: "",
      source: "",
      priority_level: "",
      discovered_at: "",
    })
    const lines = [headers.join(",")]
    for (const row of rows) {
      lines.push(headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","))
    }
    fs.writeFileSync(filePath, lines.join("\n"), "utf8")
  } else {
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts")
    XLSX.writeFile(workbook, filePath)
  }

  await db("exports").where({ id: exportId }).update({
    status: "completed",
    storage_key: storageKey,
    file_name: fileName,
    completed_at: db.fn.now(),
  })
}

const createExport = async (batchId, userId, { format = "csv", include_report = false }) => {
  const batch = await db("batches").where({ id: batchId, user_id: userId }).first()
  if (!batch) {
    const err = new Error("Batch not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  const [exportId] = await db("exports").insert({
    batch_id: batchId,
    format,
    status: "queued",
    include_report,
  })

  setImmediate(() => {
    generateExportFile(exportId, batchId, format).catch(async (err) => {
      await db("exports").where({ id: exportId }).update({
        status: "failed",
        error_message: err.message,
      })
    })
  })

  return { export_id: exportId, status: "queued" }
}

const getExport = async (exportId, userId) => {
  const row = await db("exports as e")
    .join("batches as b", "b.id", "e.batch_id")
    .select("e.id", "e.batch_id", "e.format", "e.status", "e.file_name", "e.error_message", "e.completed_at")
    .where("e.id", exportId)
    .andWhere("b.user_id", userId)
    .first()

  if (!row) {
    const err = new Error("Export not found")
    err.status = 404
    err.code = "NOT_FOUND"
    throw err
  }

  return row
}

const getExportDownloadPath = async (exportId, userId) => {
  const row = await getExport(exportId, userId)
  if (row.status !== "completed" || !row.file_name) {
    const err = new Error("Export not ready")
    err.status = 400
    err.code = "EXPORT_NOT_READY"
    throw err
  }

  const storageKey = await db("exports").select("storage_key").where({ id: exportId }).first()
  return {
    path: path.join(UPLOAD_DIR, storageKey.storage_key),
    fileName: row.file_name,
  }
}

module.exports = { createExport, getExport, getExportDownloadPath }
