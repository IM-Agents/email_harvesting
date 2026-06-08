export const MetricsCards = ({ metrics }) => {
  const cards = [
    { label: "Total Batches", value: metrics?.total_batches ?? 0 },
    { label: "Processing", value: metrics?.processing_batches ?? 0 },
    { label: "Completed", value: metrics?.completed_batches ?? 0 },
    { label: "Failed", value: metrics?.failed_batches ?? 0 },
    { label: "Contacts Discovered", value: metrics?.contacts_discovered ?? 0 },
    { label: "Avg Discovery Rate", value: metrics?.average_discovery_rate ?? 0 },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
