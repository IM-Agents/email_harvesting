export const ContactsTable = ({ contacts = [] }) => {
  if (!contacts.length) {
    return <p className="text-sm text-slate-500">No contacts found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Domain", "Email", "Name", "Title", "Source", "Priority", "Discovered"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">{c.domain}</td>
              <td className="px-4 py-3">{c.email || "—"}</td>
              <td className="px-4 py-3">{c.contact_name || c.full_name || "—"}</td>
              <td className="px-4 py-3">{c.job_title || "—"}</td>
              <td className="px-4 py-3">{c.source || "—"}</td>
              <td className="px-4 py-3">{c.priority_level}</td>
              <td className="px-4 py-3">{c.discovered_at ? new Date(c.discovered_at).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
