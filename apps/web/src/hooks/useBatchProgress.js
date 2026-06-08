import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "../lib/apiFetch"

export const useBatchProgress = (batchId, pollMs = 5000) => {
  const [batch, setBatch] = useState(null)
  const [domains, setDomains] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!batchId) return
    try {
      const [batchRes, domainsRes] = await Promise.all([
        apiFetch(`/api/v1/batches/${batchId}`),
        apiFetch(`/api/v1/batches/${batchId}/domains?limit=50`),
      ])
      setBatch(batchRes.data)
      setDomains(domainsRes.data.items || [])
      setError("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    load()
    const interval = setInterval(load, pollMs)
    return () => clearInterval(interval)
  }, [load, pollMs])

  const progress = batch?.valid_domains
    ? Math.round(((batch.processed_domains || 0) / batch.valid_domains) * 100)
    : 0

  return { batch, domains, error, loading, progress, reload: load }
}
