import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileUpload } from "../../components/FileUpload/FileUpload"
import { apiFetch, getApiBase } from "../../lib/apiFetch"

export const UploadBatchPage = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const base = getApiBase().replace(/\/$/, "")
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${base}/api/v1/batches/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed")
      setResult(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleStart = async () => {
    if (!result?.batch_id) return
    try {
      await apiFetch(`/api/v1/batches/${result.batch_id}/start`, { method: "POST" })
      navigate(`/batches/${result.batch_id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Upload Batch</h1>
      <p className="text-sm text-slate-600">
        Upload a CSV, XLS, or XLSX file with a required <code className="rounded bg-slate-100 px-1">store_url</code> column.
      </p>

      <FileUpload onFileSelect={setFile} disabled={uploading} />

      {file && (
        <p className="text-sm text-slate-700">
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p>Batch #{result.batch_id} created</p>
          <ul className="mt-2 space-y-1 text-slate-700">
            <li>Total rows: {result.total_rows}</li>
            <li>Valid domains: {result.valid_domains}</li>
            <li>Invalid rows: {result.invalid_rows}</li>
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Validating…" : "Validate & Create Batch"}
        </button>
        {result && (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Start Processing
          </button>
        )}
      </div>
    </div>
  )
}
