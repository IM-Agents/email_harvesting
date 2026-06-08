import { useState } from "react"
import { apiFetch } from "../../lib/apiFetch"

export const ExportActions = ({ batchId, disabled = false }) => {
  const [loading, setLoading] = useState(null)
  const [message, setMessage] = useState("")

  const handleExport = async (format) => {
    if (disabled) return
    setLoading(format)
    setMessage("")
    try {
      const res = await apiFetch(`/api/v1/batches/${batchId}/exports`, {
        method: "POST",
        body: JSON.stringify({ format, include_report: true }),
      })
      const exportId = res.data.export_id
      setTimeout(async () => {
        try {
          const base = typeof __API_BASE_URL__ !== "undefined" ? __API_BASE_URL__ : "/api"
          const token = localStorage.getItem("access_token")
          const downloadRes = await fetch(
            `${base.replace(/\/$/, "")}/api/v1/exports/${exportId}/download`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
          if (!downloadRes.ok) throw new Error("Export not ready yet")
          const blob = await downloadRes.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `batch-${batchId}-export.${format}`
          a.click()
          URL.revokeObjectURL(url)
          setMessage("Download started.")
        } catch {
          setMessage(`Export #${exportId} queued — try again in a few seconds.`)
        }
        setLoading(null)
      }, 2000)
    } catch (err) {
      setMessage(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => handleExport("csv")}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        aria-label="Download CSV export"
      >
        {loading === "csv" ? "Generating…" : "Download CSV"}
      </button>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => handleExport("xlsx")}
        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        aria-label="Download XLSX export"
      >
        {loading === "xlsx" ? "Generating…" : "Download XLSX"}
      </button>
      {message && <p className="w-full text-sm text-slate-600">{message}</p>}
    </div>
  )
}
