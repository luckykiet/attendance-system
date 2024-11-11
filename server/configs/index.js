const protocol = 'https://';
const subdomain = 'app.';
const www = 'www.';
const realm = 'me';
const domain = `vcap.${realm}`;
const admin_subdomain = 'admin';

const CONFIG = {
    protocol: protocol,
    domain: domain,
    admin_subdomain: admin_subdomain,
    realm: realm,
    host: protocol + subdomain + domain,
    www: protocol + www + domain,
    mongodb_host: 'mongodb://127.0.0.1:27017/attendance',
    companyName: domain.toUpperCase(),
    appName: 'ATTENDANCE SYSTEM',
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
    grecaptchaSecret: '',
    grecaptchaSiteKey: '',
};

module.exports = { CONFIG };