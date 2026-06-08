const { sleep } = require("./utils")

const withRetry = async (fn, { maxRetries = 3, backoffSeconds = [30, 60, 120] } = {}) => {
  let lastError

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      return await fn(attempt)
    } catch (err) {
      lastError = err
      if (attempt > maxRetries) break
      const delaySec = backoffSeconds[attempt - 1] ?? backoffSeconds[backoffSeconds.length - 1] ?? 30
      await sleep(delaySec * 1000)
    }
  }

  throw lastError
}

module.exports = { withRetry }
