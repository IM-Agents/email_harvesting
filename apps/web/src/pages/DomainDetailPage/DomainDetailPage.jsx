import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { apiFetch } from "../../lib/apiFetch"
import { BatchStatusBadge } from "../../components/BatchStatusBadge/BatchStatusBadge"
import { ContactsTable } from "../../components/ContactsTable/ContactsTable"
import { SourceTimeline } from "../../components/SourceTimeline/SourceTimeline"

export const DomainDetailPage = () => {
  const { domainId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch(`/api/v1/domains/${domainId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
  }, [domainId])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-slate-500">Loading domain…</p>

  const { domain, source_attempts: attempts, contacts } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{domain.domain}</h1>
        <p className="text-sm text-slate-500">{domain.store_url}</p>
        <div className="mt-2">
          <BatchStatusBadge status={domain.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-800">Company</h2>
          <p className="mt-1 text-sm">{domain.company_name || "—"}</p>
        </div>
        {domain.error_message && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h2 className="font-semibold text-red-800">Error</h2>
            <p className="mt-1 break-all text-sm text-red-700">{domain.error_message}</p>
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Source Attempts Timeline</h2>
        <SourceTimeline attempts={attempts} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Discovered Contacts</h2>
        <ContactsTable contacts={contacts} />
      </section>
    </div>
  )
}
