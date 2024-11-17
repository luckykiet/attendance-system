#!/usr/bin/env node

const app = require('../app');
const debug = require('debug')('attendance:server');
const http = require('http');
const https = require('https');
const devcert = require('devcert');
const { CONFIG } = require('../configs');

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
};

// Define ports for HTTP and HTTPS
const httpPort = normalizePort(process.env.HTTP_PORT || '3000');
const httpsPort = normalizePort(process.env.HTTPS_PORT || '4000');
app.set('port', httpsPort);

/**
 * Event listener for HTTP and HTTPS server "error" event.
 */
const onError = (error, port) => {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  if (error.code === 'EACCES') {
    console.error(`${bind} requires elevated privileges`);
    process.exit(1);
  } else if (error.code === 'EADDRINUSE') {
    console.error(`${bind} is already in use`);
    process.exit(1);
  } else {
    throw error;
  }
};

/**
 * Event listener for HTTP and HTTPS server "listening" event.
 */
const onListening = (server, protocol) => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Server running on ${bind} (${protocol})`);
  debug(`Listening on ${bind}`);
};

/**
 * Initialize and start HTTP and HTTPS servers with devcert.
 */
const startServer = async () => {
  try {

    const defaultDomains = CONFIG.domain || 'vcap.me'
    const domains = [defaultDomains]

    if (CONFIG.admin_subdomain) {
      domains.push(`${CONFIG.admin_subdomain}.${defaultDomains}`);
    }
    if (CONFIG.subdomain) {
      domains.push(`${CONFIG.subdomain}.${defaultDomains}`)
    }

    // Generate SSL certificate
    const ssl = await devcert.certificateFor(domains);
    const httpsServer = https.createServer({ key: ssl.key, cert: ssl.cert }, app);
    const httpServer = http.createServer(app);

    console.log('Configured HTTPS for domains:', domains.join(', '));

    // Start HTTP server and bind to 0.0.0.0
    httpServer.listen(httpPort, '0.0.0.0');
    httpServer.on('error', (error) => onError(error, httpPort));
    httpServer.on('listening', () => onListening(httpServer, 'HTTP', httpPort));

    // Start HTTPS server and bind to 0.0.0.0
    httpsServer.listen(httpsPort, '0.0.0.0');
    httpsServer.on('error', (error) => onError(error, httpsPort));
    httpsServer.on('listening', () => onListening(httpsServer, 'HTTPS', httpsPort));

  } catch (error) {
    console.error('Failed to start servers:', error);
    process.exit(1);
  }
};

startServer();
