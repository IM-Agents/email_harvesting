import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/apiFetch"

export const ReportsPage = () => {
  const [batches, setBatches] = useState([])
  const [batchId, setBatchId] = useState("")
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/api/v1/batches?limit=50")
      .then((res) => {
        setBatches(res.data.items || [])
        if (res.data.items?.[0]) setBatchId(String(res.data.items[0].id))
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!batchId) return
    apiFetch(`/api/v1/batches/${batchId}/report`)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.message))
  }, [batchId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

      <div>
        <label htmlFor="report-batch" className="block text-sm font-medium text-slate-700">
          Select batch
        </label>
        <select
          id="report-batch"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.id} — {b.original_file_name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Contact discovery rate", value: report.contact_discovery_rate },
            { label: "Executive contact rate", value: report.executive_contact_rate },
            { label: "Failure rate", value: `${report.failure_rate}%` },
            { label: "Success rate", value: `${report.success_rate}%` },
            { label: "Avg processing time", value: `${report.average_processing_time_seconds}s` },
            { label: "Invalid URL count", value: report.invalid_rows },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {report?.contacts_per_source?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Contacts per source</h2>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            {report.contacts_per_source.map((row) => (
              <li key={row.source} className="flex justify-between">
                <span>{row.source || "Unknown"}</span>
                <span className="font-medium">{row.contacts_found}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
