#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require('../app')
const debug = require('debug')('attendance:server')
const https = require('https')
// const spdy = require('spdy');
const fs = require('fs')

/**
 * Normalize a port into a number, string, or false.
 */

const normalizePort = (val) => {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTPS server "error" event.
 */

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTPS server "listening" event.
 */

const onListening = () => {
  const addr = server.address()
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
  debug(`Listening on ${bind}`)
}

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '4000')
app.set('port', port)

/**
 * Create HTTPS server.
 */

const server = https.createServer(
  {
    key: fs.readFileSync('./security/vcap-me-key.pem'),
    cert: fs.readFileSync('./security/vcap-me-cert.pem'),
  },
  app,
)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)
