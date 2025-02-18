require('dotenv').config();

const protocol = 'https://';
const realm = 'me';
const domain = `vcap.${realm}`;
const subdomain = 'attendance';
const proxyUrl = '';

const CONFIG = {
    isDev: process.env.NODE_ENV === 'development',

    // Information of the application
    appName: 'ATTENDANCE SYSTEM',
    mobileIntent: 'gokasaworkforce://',
    companyName: domain.toUpperCase(),
    
    // Information of the server
    protocol,
    domain,
    subdomain,
    realm,
    www: `${protocol}www.${subdomain}${domain}`,
    proxyUrl,

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
            refreshToken: '',
        },
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
