import { Formik, Form, Field } from "formik"
import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/apiFetch"

export const SettingsPage = () => {
  const [initial, setInitial] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/api/v1/admin/settings")
      .then((res) => setInitial(res.data))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!initial) return <p className="text-slate-500">Loading settings…</p>

  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage("")
    try {
      await apiFetch("/api/v1/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          worker_count: Number(values.worker_count),
          proxy_enabled: values.proxy_enabled === "true",
          headless: values.headless === "true",
          retry_backoff_seconds: values.retry_backoff_seconds
            .split(",")
            .map((n) => Number(n.trim()))
            .filter(Boolean),
        }),
      })
      setMessage("Settings saved.")
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-600">Admin-only operational configuration.</p>

      <Formik
        initialValues={{
          worker_count: initial.worker_count,
          proxy_enabled: String(initial.proxy_enabled),
          headless: String(initial.headless),
          retry_backoff_seconds: (initial.retry_backoff_seconds || []).join(", "),
        }}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <label htmlFor="worker_count" className="block text-sm font-medium text-slate-700">
                Worker count
              </label>
              <Field
                id="worker_count"
                name="worker_count"
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="proxy_enabled" className="block text-sm font-medium text-slate-700">
                Proxy enabled
              </label>
              <Field
                id="proxy_enabled"
                name="proxy_enabled"
                as="select"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Field>
            </div>
            <div>
              <label htmlFor="headless" className="block text-sm font-medium text-slate-700">
                Headless browser
              </label>
              <Field
                id="headless"
                name="headless"
                as="select"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Field>
            </div>
            <div>
              <label htmlFor="retry_backoff_seconds" className="block text-sm font-medium text-slate-700">
                Retry backoff (seconds, comma-separated)
              </label>
              <Field
                id="retry_backoff_seconds"
                name="retry_backoff_seconds"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            {message && <p className="text-sm text-slate-600">{message}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save settings
            </button>
          </Form>
        )}
      </Formik>
    </div>
  )
}
