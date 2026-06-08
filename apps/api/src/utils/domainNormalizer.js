const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"])

const isPrivateIp = (host) => {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false
  const parts = host.split(".").map(Number)
  if (parts[0] === 10) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  if (parts[0] === 127) return true
  return false
}

const normalizeDomain = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL is empty" }
  }

  let value = rawUrl.trim()
  if (!value) {
    return { valid: false, error: "URL is empty" }
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return { valid: false, error: "Malformed URL" }
  }

  let host = parsed.hostname.toLowerCase().replace(/^www\./, "")
  if (!host || BLOCKED_HOSTS.has(host) || isPrivateIp(host)) {
    return { valid: false, error: "Invalid or internal domain" }
  }

  const parts = host.split(".")
  if (parts.length >= 3) {
    const subdomain = parts[0]
    if (subdomain === "shop" || subdomain === "m" || subdomain === "store" || subdomain === "mobile") {
      host = parts.slice(1).join(".")
    }
  }

  return {
    valid: true,
    domain: host,
    storeUrl: parsed.href,
  }
}

module.exports = { normalizeDomain }
