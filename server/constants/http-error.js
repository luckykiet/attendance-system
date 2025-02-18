class HttpError extends Error {
  constructor(message, errorCode, logMessage = '') {
    super(JSON.stringify(message))
    this.code = errorCode
    this.logMessage = logMessage
  }
}

module.exports = HttpError
