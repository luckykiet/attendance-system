class HttpError extends Error {
  /**
   * @param {string} message
   * @param {number} errorCode
   * @param {string} logMessage
   * @param {string} logger - create logger in logger.js
   */
  constructor(message, errorCode, logMessage = '', logger = 'http') {
    super(JSON.stringify(message))
    this.code = errorCode
    this.logger = logger
    this.logMessage = logMessage
  }
}

module.exports = HttpError
