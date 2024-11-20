const development = process.env.NODE_ENV === 'development';
const isUsingRecaptcha = process.env.NODE_ENV !== 'test'
const protocol = 'https://';
const subdomain = 'attendance';
const www = 'www.';
const realm = 'me';
const domain = `vcap.${realm}`;
const admin_subdomain = 'admin';
const admin_port = '5173'
const admin_domain = `${admin_subdomain}.${domain}${development ? `:${admin_port}` : ''}`;
const proxy_domain = development ? '' : '';
const mobile_intent = 'gowork://';

const CONFIG = {
    protocol: protocol,
    domain: domain,
    admin_port: admin_port,
    admin_subdomain: admin_subdomain,
    admin_domain: admin_domain,
    subdomain: subdomain,
    realm: realm,
    host: proxy_domain ? proxy_domain : `${protocol}${subdomain}.${domain}`,
    www: protocol + www + domain,
    mobile_intent: mobile_intent,
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
    isUsingRecaptcha: isUsingRecaptcha,
};

module.exports = { CONFIG };