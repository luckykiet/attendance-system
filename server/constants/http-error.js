class HttpError extends Error {
  constructor(message, errorCode) {
    super(JSON.stringify(message))
    this.code = errorCode
  }
}

module.exports = HttpError
