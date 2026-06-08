import { useEffect, useState } from "react"
import { apiFetch } from "../lib/apiFetch"

export const HomePage = () => {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadHealth = async () => {
      try {
        const data = await apiFetch("/api/health")
        if (mounted) setHealth(data)
      } catch (err) {
        if (mounted) setError(err.message)
      }
    }

    loadHealth()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Email Harvesting &amp; Contact Discovery
      </h1>
      <p className="mt-4 text-slate-600">
        Platform scaffold — routing and API wiring placeholder. Business features ship in later milestones.
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          API health
        </h2>
        {health && (
          <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-emerald-300">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {!health && !error && (
          <p className="mt-3 text-sm text-slate-500">Checking API…</p>
        )}
      </div>
    </section>
  )
}
