class ScraperError extends Error {
  constructor(message, code, status = "failed") {
    super(message)
    this.name = "ScraperError"
    this.code = code
    this.status = status
  }
}

class LoginFailedError extends ScraperError {
  constructor(message = "Login failed") {
    super(message, "LOGIN_FAILED", "login_failed")
  }
}

class CaptchaDetectedError extends ScraperError {
  constructor(message = "CAPTCHA detected") {
    super(message, "CAPTCHA_DETECTED", "captcha_detected")
  }
}

class TimeoutError extends ScraperError {
  constructor(message = "Operation timed out") {
    super(message, "TIMEOUT", "timeout")
  }
}

class ProxyFailedError extends ScraperError {
  constructor(message = "Proxy connection failed") {
    super(message, "PROXY_FAILED", "proxy_failed")
  }
}

class PageStructureChangedError extends ScraperError {
  constructor(message = "Unexpected page structure") {
    super(message, "PAGE_STRUCTURE_CHANGED", "page_structure_changed")
  }
}

module.exports = {
  ScraperError,
  LoginFailedError,
  CaptchaDetectedError,
  TimeoutError,
  ProxyFailedError,
  PageStructureChangedError,
}
