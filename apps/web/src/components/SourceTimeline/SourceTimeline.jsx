import { BatchStatusBadge } from "../BatchStatusBadge/BatchStatusBadge"

export const SourceTimeline = ({ attempts = [] }) => {
  if (!attempts.length) {
    return <p className="text-sm text-slate-500">No source attempts recorded yet.</p>
  }

  return (
    <ol className="space-y-3" aria-label="Source attempts timeline">
      {attempts.map((attempt) => (
        <li
          key={attempt.id}
          className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-900">{attempt.source}</span>
            <BatchStatusBadge status={attempt.status} />
          </div>
          <p className="mt-1 text-slate-600">
            Contacts extracted: {attempt.contacts_extracted ?? 0}
          </p>
          {attempt.started_at && (
            <p className="mt-1 text-xs text-slate-400">
              {new Date(attempt.started_at).toLocaleString()}
              {attempt.completed_at
                ? ` → ${new Date(attempt.completed_at).toLocaleString()}`
                : ""}
            </p>
          )}
          {attempt.error_message && (
            <p
              className="mt-2 break-all rounded bg-red-50 p-2 text-red-700"
              role="alert"
              tabIndex={0}
            >
              {attempt.error_message}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
