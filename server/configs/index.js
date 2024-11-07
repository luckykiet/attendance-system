const protocol = 'https://';
const subdomain = 'app.';
const www = 'www.';
const realm = 'me';
const domain = `vcap.${realm}`;

const CONFIG = {
    protocol: protocol,
    domain: domain,
    realm: realm,
    host: protocol + subdomain + domain,
    www: protocol + www + domain,
    mongodb_host: 'mongodb://127.0.0.1:27017/attendance',
    companyName: domain.toUpperCase(),
    appName: 'ATTENDANCE SYSTEM',
    jwtSecret: '',
    mail_transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: `no-reply@${domain}`,
            // secrets
            clientId: '',
            clientSecret: '',
            refreshToken: '',
        },
    },
    grecaptchaSecret: '',
    grecaptchaSiteKey: '',
};

module.exports = { CONFIG };