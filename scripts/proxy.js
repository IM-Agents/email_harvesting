const express = require("express")
const path = require("path")
const { createProxyMiddleware } = require("http-proxy-middleware")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

const ROOT = findMonorepoRoot(path.join(__dirname, ".."))

const cliPublicPath = process.env.PUBLIC_PATH
const cliPort = process.env.PORT
const cliApiPort = process.env.API_PORT
loadEnv({ rootDir: ROOT })
if (cliPublicPath) process.env.PUBLIC_PATH = cliPublicPath
if (cliPort) process.env.PORT = cliPort
if (cliApiPort) process.env.API_PORT = cliApiPort

const PORT = parseInt(process.env.PORT || "8080", 10)
const API_PORT = parseInt(process.env.API_PORT || "4000", 10)
const PUBLIC_PATH = (process.env.PUBLIC_PATH || "/").replace(/\/$/, "") || ""
const prefix = PUBLIC_PATH === "" ? "" : PUBLIC_PATH
const webDist = path.join(ROOT, "apps/web/dist")

const app = express()

const apiPathMatcher = (pathname) => {
  const apiRoot = prefix ? `${prefix}/api` : "/api"
  return pathname === apiRoot || pathname.startsWith(`${apiRoot}/`)
}

const rewriteApiPath = (pathname) => {
  if (prefix && pathname.startsWith(`${prefix}/api`)) {
    return pathname.slice(prefix.length)
  }
  return pathname
}

if (!Number.isFinite(API_PORT)) {
  console.error("[proxy] Invalid API_PORT — set via preview-start or API_PORT= in env")
  process.exit(1)
}

const apiProxy = createProxyMiddleware({
  target: `http://127.0.0.1:${API_PORT}`,
  changeOrigin: true,
  pathRewrite: rewriteApiPath,
})

app.use((req, res, next) => {
  if (!apiPathMatcher(req.path)) return next()
  return apiProxy(req, res, next)
})

const staticMount = prefix || "/"
app.use(staticMount, express.static(webDist, { index: false }))

app.get("*", (req, res, next) => {
  if (apiPathMatcher(req.path)) {
    return res.status(502).json({
      error: "API proxy misconfigured",
      path: req.path,
      publicPath: prefix || "/",
    })
  }
  if (/\.[a-z0-9]+(\?.*)?$/i.test(req.path)) {
    return res.status(404).type("text/plain").send("Not found")
  }
  res.sendFile(path.join(webDist, "index.html"))
})

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[proxy] http://127.0.0.1:${PORT}${prefix || "/"} | PUBLIC_PATH=${prefix || "/"} API_PORT=${API_PORT}`
  )
})
