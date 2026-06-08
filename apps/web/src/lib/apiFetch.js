export const getApiBase = () => {
  if (typeof __API_BASE_URL__ !== "undefined") {
    return __API_BASE_URL__
  }
  return "/api"
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const apiFetch = async (endpoint, options = {}) => {
  const base = getApiBase().replace(/\/$/, "")
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  if (base.endsWith("/api") && path.startsWith("/api")) {
    path = path.slice(4) || "/"
  }

  const url = `${base}${path}`
  const isFormData = options.body instanceof FormData

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error?.message || `API error: HTTP ${response.status}`
    const err = new Error(message)
    err.status = response.status
    err.code = data?.error?.code
    throw err
  }

  return data
}

export const getRouterBasename = () => {
  const base = getApiBase()
  if (base === "/api") return undefined
  return base.replace(/\/$/, "") || undefined
}
