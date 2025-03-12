const protocol = 'https://';
const realm = 'me';
const domain = `vcap.${realm}`;
const subdomain = 'attendance';
const port = '4000';

/**
 * Configuration of the application
 * DON'T CALL THIS FILE DIRECTLY
 * 
 * @type {Object}
 * @property {string} appName - Name of the application
 * @property {string} mobileIntent - Intent for the mobile application
 * @property {string} companyName - Name of the company
 * @property {string} protocol - Protocol of the server
 * @property {string} domain - Domain of the server
 * @property {string} subdomain - Subdomain of the server
 * @property {string} realm - Realm of the server
 * @property {string} proxyUrl - Proxy URL
 * @property {string} mongodb_host - MongoDB host
 * @property {string} jwtSecret - JWT secret
 * @property {Object} mail_transport - Mail transport configuration
 * @property {Object} grecaptchaSecrets - Google reCAPTCHA secrets
 * @property {Object} grecaptchaSiteKeys - Google reCAPTCHA site keys
 * @property {Object} googleMapsApiKeys - Google Maps API keys
 * 
 */

const CONFIG = {
    // Information of the application
    appName: 'ATTENDANCE SYSTEM',
    mobileIntent: 'gokasaworkforce://',
    companyName: '',
    
    // Information of the server
    protocol,
    domain,
    subdomain,
    realm,
    port,
    proxyUrl: '',

    // MongoDB configuration
    mongodb_host: 'mongodb://127.0.0.1:27017/attendance',

    // Server configuration
    jwtSecret: '',
    mail_transport: {
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: '',
            clientId: '',
            clientSecret: '',
            refreshToken: ''
        }
    },
    
    // Google reCAPTCHA configuration
    // Add more domains if needed
    grecaptchaSecrets: {
        [domain] : '',
    },
    grecaptchaSiteKeys: {
        [domain] : '',
    },

    // Google Maps API configuration
    googleMapsApiKeys: {
        [domain] : '',
    },
};

module.exports = { CONFIG };
