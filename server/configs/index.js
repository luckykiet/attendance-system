const { CONFIG } = require('./config');
const { PRIVILEGES } = require('./privileges');
const { REQUEST_STATUS } = require('./status');
const { DAY_KEYS } = require('./day');
const { SPECIFIC_BREAKS } = require('./specific-breaks');


// Modifying environment variables
const getConfig = () => {
    const hasDotAtTheEnd = (str) => str[str.length - 1] === '.';
    const constructUrl = ({ protocol, subdomain, domain, port, isWww = false }) => `${protocol}${isWww ? 'www.' : ''}${subdomain ? hasDotAtTheEnd(subdomain) ? subdomain : `${subdomain}.` : ''}${domain}${port ? `:${port}` : ''}`;
    const config = CONFIG;
    config.isDev = process.env.NODE_ENV === 'development';
    config.isTest = process.env.NODE_ENV === 'test';
    config.isProd = process.env.NODE_ENV === 'production';

    if (config.isTest) {
        config.jwtSecret = 'test';
    }

    if (config.isDev || config.isTest) {
        config.mongodb_host = 'mongodb://127.0.0.1:27017/attendance_dev';
        config.jwtSecret = 'dev_secret';
    }

    if (config.isProd) {
        config.port = '';
    }

    const { protocol, subdomain, domain, port } = config;

    config.appName = config.appName || 'ATTENDANCE SYSTEM';
    config.companyName = config.companyName || domain.toUpperCase();
    config.www = constructUrl({ protocol, subdomain, domain, port, isWww: true });
    config.host = config.proxyUrl ? config.proxyUrl : constructUrl({ protocol, subdomain, domain, port });
    if (config.isProd) {
        config.url = config.proxyUrl ? config.proxyUrl : constructUrl({ protocol, subdomain, domain, port });
    } else {
        config.url = constructUrl({ protocol, subdomain: 'admin', domain, port: 5173 });
    }

    return config
}

module.exports = {
    CONFIG: getConfig(),
    PRIVILEGES,
    REQUEST_STATUS,
    DAY_KEYS,
    SPECIFIC_BREAKS
}