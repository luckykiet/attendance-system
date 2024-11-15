const devcert = require('devcert');
const { CONFIG } = require('../configs');

const defaultDomains = CONFIG.domain || 'attendance.local'
const domains = [defaultDomains]

const generateDevCert = async () => {
    const configuredDomains = devcert.configuredDomains()
    if (configuredDomains.length > 0) {
        console.log('DevCert already configured for domains:', configuredDomains.join(', '));
    } else {
        if (CONFIG.admin_subdomain) {
            domains.push(`${CONFIG.admin_subdomain}.${defaultDomains}`)
        }
        console.log('Configuring HTTPS for domains:', domains.join(', '));
        await devcert.certificateFor(domains);
        console.log('Configured HTTPS for domains:', devcert.configuredDomains().join(', '));
    }
}
generateDevCert()