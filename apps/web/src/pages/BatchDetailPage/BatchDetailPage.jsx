import { Link, useParams } from "react-router-dom"
import { apiFetch } from "../../lib/apiFetch"
import { BatchStatusBadge } from "../../components/BatchStatusBadge/BatchStatusBadge"
import { ExportActions } from "../../components/ExportActions/ExportActions"
import { ProgressSummary } from "../../components/ProgressSummary/ProgressSummary"
import { useBatchProgress } from "../../hooks/useBatchProgress"

export const BatchDetailPage = () => {
  const { batchId } = useParams()
  const { batch, domains, error, loading, progress, reload } = useBatchProgress(batchId)

  const handleAction = async (action) => {
    try {
      await apiFetch(`/api/v1/batches/${batchId}/${action}`, { method: "POST" })
      reload()
    } catch (err) {
      // surface via parent error state on next poll
      console.error(err.message)
    }
  }

  if (loading && !batch && !error) {
    return <p className="text-slate-500">Loading batch…</p>
  }

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

      <ProgressSummary batch={batch} progress={progress} />

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
