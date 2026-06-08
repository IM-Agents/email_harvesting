const STATUS_STYLES = {
  uploaded: "bg-slate-100 text-slate-700",
  queued: "bg-blue-100 text-blue-800",
  processing: "bg-amber-100 text-amber-800",
  paused: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-600",
}

export const BatchStatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.uploaded
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status?.replace(/_/g, " ")}
    </span>
  )
}
