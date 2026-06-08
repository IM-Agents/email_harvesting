const fs = require("fs")
const path = require("path")
const { parse } = require("csv-parse/sync")
const XLSX = require("xlsx")
const { normalizeDomain } = require("../utils/domainNormalizer")

const parseSpreadsheet = (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase()
  let rows = []

  if (ext === ".csv") {
    const content = fs.readFileSync(filePath, "utf8")
    rows = parse(content, { columns: true, skip_empty_lines: true, trim: true })
  } else if (ext === ".xls" || ext === ".xlsx") {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" })
  } else {
    const err = new Error("File extension must be .csv, .xls, or .xlsx")
    err.status = 400
    err.code = "VALIDATION_ERROR"
    throw err
  }

  if (!rows.length) {
    const err = new Error("File contains no data rows")
    err.status = 400
    err.code = "VALIDATION_ERROR"
    throw err
  }

  const columns = Object.keys(rows[0])
  const storeUrlKey = columns.find((c) => c.toLowerCase().replace(/\s+/g, "_") === "store_url")
  if (!storeUrlKey) {
    const err = new Error("store_url column is required")
    err.status = 400
    err.code = "VALIDATION_ERROR"
    throw err
  }

  const seenDomains = new Set()
  const parsedRows = []
  let validCount = 0
  let invalidCount = 0

  rows.forEach((row, index) => {
    const storeUrl = String(row[storeUrlKey] || "").trim()
    const result = normalizeDomain(storeUrl)

    if (!result.valid) {
      invalidCount += 1
      parsedRows.push({
        rowNumber: index + 1,
        storeUrl,
        normalizedDomain: null,
        validationStatus: "invalid",
        validationError: result.error,
      })
      return
    }

    if (seenDomains.has(result.domain)) {
      invalidCount += 1
      parsedRows.push({
        rowNumber: index + 1,
        storeUrl: result.storeUrl,
        normalizedDomain: result.domain,
        validationStatus: "duplicate",
        validationError: "Duplicate domain",
      })
      return
    }

    seenDomains.add(result.domain)
    validCount += 1
    parsedRows.push({
      rowNumber: index + 1,
      storeUrl: result.storeUrl,
      normalizedDomain: result.domain,
      validationStatus: "valid",
      validationError: null,
    })
  })

  return {
    rows: parsedRows,
    totalRows: rows.length,
    validDomains: validCount,
    invalidRows: invalidCount,
  }
}

module.exports = { parseSpreadsheet }
