import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { apiFetch } from "../../lib/apiFetch"
import { BatchStatusBadge } from "../../components/BatchStatusBadge/BatchStatusBadge"
import { ExportActions } from "../../components/ExportActions/ExportActions"

export const BatchDetailPage = () => {
  const { batchId } = useParams()
  const [batch, setBatch] = useState(null)
  const [domains, setDomains] = useState([])
  const [error, setError] = useState("")

  const load = async () => {
    try {
      const [batchRes, domainsRes] = await Promise.all([
        apiFetch(`/api/v1/batches/${batchId}`),
        apiFetch(`/api/v1/batches/${batchId}/domains?limit=20`),
      ])
      setBatch(batchRes.data)
      setDomains(domainsRes.data.items || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [batchId])

  const handleAction = async (action) => {
    try {
      await apiFetch(`/api/v1/batches/${batchId}/${action}`, { method: "POST" })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!batch && !error) {
    return <p className="text-slate-500">Loading batch…</p>
  }

  const progress = batch?.valid_domains
    ? Math.round(((batch.processed_domains || 0) / batch.valid_domains) * 100)
    : 0

  const canExport = (batch?.contacts_found || 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch #{batchId}</h1>
          <p className="text-sm text-slate-500">{batch?.original_file_name}</p>
        </div>
        <BatchStatusBadge status={batch?.status} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-slate-500">Valid domains</p>
            <p className="font-semibold">{batch?.valid_domains}</p>
          </div>
          <div>
            <p className="text-slate-500">Processed</p>
            <p className="font-semibold">{batch?.processed_domains}</p>
          </div>
          <div>
            <p className="text-slate-500">Contacts found</p>
            <p className="font-semibold">{batch?.contacts_found}</p>
          </div>
          <div>
            <p className="text-slate-500">Failed domains</p>
            <p className="font-semibold">{batch?.failed_domains}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["start", "pause", "resume", "cancel"].map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => handleAction(action)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm capitalize hover:bg-slate-50"
          >
            {action}
          </button>
        ))}
      </div>

      <ExportActions batchId={batchId} disabled={!canExport} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Domains</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Domain", "Status", "Contacts", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domains.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">{d.domain}</td>
                  <td className="px-4 py-3">
                    <BatchStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">{d.selected_contact_count}</td>
                  <td className="px-4 py-3">
                    <Link to={`/domains/${d.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
