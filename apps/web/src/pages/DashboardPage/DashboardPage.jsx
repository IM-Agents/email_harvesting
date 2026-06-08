import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch } from "../../lib/apiFetch"
import { MetricsCards } from "../../components/MetricsCards/MetricsCards"
import { BatchStatusBadge } from "../../components/BatchStatusBadge/BatchStatusBadge"

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null)
  const [batches, setBatches] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, batchesRes] = await Promise.all([
          apiFetch("/api/v1/batches/dashboard"),
          apiFetch("/api/v1/batches?limit=5"),
        ])
        setMetrics(metricsRes.data)
        setBatches(batchesRes.data.items || [])
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          to="/upload"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload Batch
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <MetricsCards metrics={metrics} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Recent Batches</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["ID", "File", "Status", "Domains", "Contacts", "Created"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/batches/${b.id}`} className="text-blue-600 hover:underline">
                      #{b.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.original_file_name}</td>
                  <td className="px-4 py-3">
                    <BatchStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">{b.valid_domains}</td>
                  <td className="px-4 py-3">{b.contacts_found}</td>
                  <td className="px-4 py-3">{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!batches.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No batches yet. Upload a file to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
