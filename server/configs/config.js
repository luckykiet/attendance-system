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
            user: 'admin@gokarte.cz',
            clientId: '113712253408-i8v0a4na1k8govgh3qg7ms6kflp01nim.apps.googleusercontent.com',
            clientSecret: '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',
            refreshToken: '1//04SPbeSYOh0BACgYIARAAGAQSNwF-L9IrDn-JUGTy6hT1qIjMTZOwn-r1_wNzOkiOyR-LYymTWxXeXIy040XCG35-249dvTOmT0I'
        }
    },
    
    // Google reCAPTCHA configuration
    // Add more domains if needed
    grecaptchaSecrets: {
        [domain] : '6LdD2n8qAAAAAPZ8GFYJYv4hR5AUl2YOaZVKWoP-',
    },
    grecaptchaSiteKeys: {
        [domain] : '6LdD2n8qAAAAAF2BlErmn1B4iwyy0IFGWgel7Iq2',
    },

    // Google Maps API configuration
    googleMapsApiKeys: {
        [domain] : 'AIzaSyDZKfnYpMS7RlMLvNtHvVaZ-wCyFc98ThQ',
    },
};

module.exports = { CONFIG };
