import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/apiFetch"
import { ContactsTable } from "../../components/ContactsTable/ContactsTable"

export const ContactsPage = () => {
  const [batches, setBatches] = useState([])
  const [batchId, setBatchId] = useState("")
  const [contacts, setContacts] = useState([])
  const [filters, setFilters] = useState({ domain: "", source: "", has_email: "" })
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
    const params = new URLSearchParams({ limit: "100", ...filters })
    Object.keys(filters).forEach((k) => {
      if (!filters[k]) params.delete(k)
    })
    apiFetch(`/api/v1/batches/${batchId}/contacts?${params}`)
      .then((res) => setContacts(res.data.items || []))
      .catch((err) => setError(err.message))
  }, [batchId, filters])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Contacts Results</h1>

      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="batch-select" className="block text-sm font-medium text-slate-700">
            Batch
          </label>
          <select
            id="batch-select"
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
        <div>
          <label htmlFor="domain-filter" className="block text-sm font-medium text-slate-700">
            Domain
          </label>
          <input
            id="domain-filter"
            type="text"
            value={filters.domain}
            onChange={(e) => setFilters((f) => ({ ...f, domain: e.target.value }))}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Filter domain"
          />
        </div>
        <div>
          <label htmlFor="has-email" className="block text-sm font-medium text-slate-700">
            Has email
          </label>
          <select
            id="has-email"
            value={filters.has_email}
            onChange={(e) => setFilters((f) => ({ ...f, has_email: e.target.value }))}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <ContactsTable contacts={contacts} />
    </div>
  )
}
