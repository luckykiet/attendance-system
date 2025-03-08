const winston = require('winston');
const { combine, timestamp, json, errors } = winston.format;
const _ = require('lodash');
const path = require('path');
const logFolder = process.env.NODE_ENV !== 'test' ? 'logs' : 'test-logs';
const logPath = path.join(__dirname, '..', logFolder);
const createLoggerConfig = ({
    level = 'info',
    name,
    filename = '',
    serviceName = '',
}) => {
    if (!name) {
        throw new Error('Logger name is required');
    }
    const newFilename = (filename || `${name}.log`).toLowerCase();
    const newService = (serviceName || `${_.upperFirst(name)}Service`);

    return winston.loggers.add(name, {
        level,
        format: combine(
            errors({ stack: true }),
            timestamp(),
            json(),
            // prettyPrint(),
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: path.join(logPath, newFilename) }),
        ],
        defaultMeta: { service: newService },
    });
};

module.exports = {
    createLoggerConfig
};