const development = process.env.NODE_ENV === 'development';
const protocol = 'https://';
const subdomain = 'app.';
const www = 'www.';
const realm = 'local';
const domain = `attendance.${realm}`;
const admin_subdomain = 'admin';
const admin_port = '5173'
const admin_domain = `${admin_subdomain}.${domain}${development ? `:${admin_port}` : ''}`;

const CONFIG = {
    protocol: protocol,
    domain: domain,
    admin_port: admin_port,
    admin_subdomain: admin_subdomain,
    admin_domain: admin_domain,
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
};

module.exports = { CONFIG };