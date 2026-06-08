export const ProgressSummary = ({ batch, progress }) => {
  if (!batch) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-slate-700">Progress</span>
        <span>{progress}%</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Batch processing progress"
      >
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-slate-500">Valid domains</p>
          <p className="font-semibold">{batch.valid_domains}</p>
        </div>
        <div>
          <p className="text-slate-500">Processed</p>
          <p className="font-semibold">{batch.processed_domains}</p>
        </div>
        <div>
          <p className="text-slate-500">Contacts found</p>
          <p className="font-semibold">{batch.contacts_found}</p>
        </div>
        <div>
          <p className="text-slate-500">Failed</p>
          <p className="font-semibold">{batch.failed_domains}</p>
        </div>
      </div>
    </div>
  )
}
