#!/usr/bin/env node

const app = require('../app');
const debug = require('debug')('attendance:server');
const http = require('http');
const https = require('https');
const devcert = require('@expo/devcert');

/**
 * Normalize a port into a number, string, or false.
 */

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

/**
 * Get ports from environment and store in Express.
 */

const httpPort = normalizePort(process.env.HTTP_PORT || '3000'); // HTTP port
const httpsPort = normalizePort(process.env.HTTPS_PORT || '4000'); // HTTPS port
app.set('port', httpsPort); // Set the HTTPS port in the app

/**
 * Create HTTP and HTTPS servers with devcert.
 */
const startServer = async () => {
  try {
    // Create HTTPS server with certificate from devcert
    const ssl = await devcert.certificateFor('attendance.local');
    const httpsServer = https.createServer(
      {
        key: ssl.key,
        cert: ssl.cert,
      },
      app
    );

    const httpServer = http.createServer(app);

    /**
     * Event listener for HTTP and HTTPS server "error" event.
     */
    const onError = (error, serverType) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      const bind = typeof serverType === 'string' ? `Pipe ${serverType}` : `Port ${serverType}`;
      switch (error.code) {
        case 'EACCES':
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    };

    /**
     * Event listener for HTTP and HTTPS server "listening" event.
     */
    const onListening = (serverType, serverPort) => {
      const addr = serverType.address();
      const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
      console.log(`Server running on ${bind} (${serverPort === httpsPort ? 'HTTPS' : 'HTTP'})`);
      debug(`Listening on ${bind}`);
    };

    // Start HTTP and HTTPS servers
    httpServer.listen(httpPort);
    httpServer.on('error', (error) => onError(error, httpPort));
    httpServer.on('listening', () => onListening(httpServer, httpPort));

    httpsServer.listen(httpsPort);
    httpsServer.on('error', (error) => onError(error, httpsPort));
    httpsServer.on('listening', () => onListening(httpsServer, httpsPort));

  } catch (error) {
    console.error('Failed to start servers:', error);
    process.exit(1);
  }
};

startServer(); // Call the async function to start both servers
