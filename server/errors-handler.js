const fs = require('fs');
const HttpError = require('./constants/http-error');
const { loggers } = require('./utils');

const errorLogger = (err, req, res, next) => {
  console.log(err)
  if (err instanceof HttpError) {
    loggers[err.logger].error(err.logMessage || err.message, {
      route: req.originalUrl,
      method: req.method,
      code: err.code,
    });
  }
  console.error(
    '\x1b[31m',
    err.code ? `${err.code} ${err.message}` : err instanceof Error ? err.message : err,
  )
  next(err)
}

const errorResponder = (err, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Failed to delete uploaded file:', unlinkErr);
    });
  }

  if (res.headersSent) {
    return next(err);
  }

  res.header('Content-Type', 'application/json');

  if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
    res.status(422).json({
      success: false,
      msg: Object.keys(err.errors).reduce((errors, key) => {
        errors[key] = 'srv_validation_error';
        return errors;
      }, {}),
    });
  } else if (err.code === 11000) {
    res.status(409).json({
      success: false,
      msg: 'srv_error',
    });
  } else {
    let errorMsg;

    try {
      errorMsg = err.message ? JSON.parse(err.message) : 'An unknown error occurred!';
    } catch (parseError) {
      errorMsg = parseError instanceof Error ? parseError.message : err.message || 'An unknown error occurred!';
    }

    res.status(err.code || 500).send({
      success: false,
      msg: errorMsg,
    });
  }
};

module.exports = { errorLogger, errorResponder }
