const fs = require('fs')

const errorLogger = (err, req, res, next) => {
  console.error(
    '\x1b[31m',
    err.code ? `${err.code} ${err.message}` : err.message
  )
  next(err)
}

const errorResponder = (err, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err)
    })
  }

  if (res.headerSent) {
    return next(err)
  }

  res.header('Content-Type', 'application/json')

  if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
    res.status(422).json({
      success: false,
      msg: Object.keys(err.errors).reduce((errors, key) => {
        errors[key] = 'srv_validation_error'
        return errors
      }, {}),
    })
  } else if (err.code === 11000) {
    res.status(409).json({
      success: false,
      msg: 'srv_error',
    })
  } else {
    res.status(err.code || 500).send({
      success: false,
      msg: err.message ? JSON.parse(err.message) : 'An unknown error occurred!',
    })
  }
}

module.exports = { errorLogger, errorResponder }
