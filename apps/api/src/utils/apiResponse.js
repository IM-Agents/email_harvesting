const success = (res, data, message = "OK", status = 200) => {
  res.status(status).json({ success: true, data, message })
}

const error = (res, code, message, status = 400, details = {}) => {
  res.status(status).json({
    success: false,
    error: { code, message, details },
  })
}

module.exports = { success, error }
