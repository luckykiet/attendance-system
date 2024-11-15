const devcert = require('devcert');
const configuredDomains = devcert.configuredDomains()

if (configuredDomains.length > 0) {
    devcert.removeDomain(configuredDomains)
    console.log('DevCert removed for domains:', configuredDomains.join(', '));
} else {
    console.log('DevCert not configured for any domains.');
}
console.log('Uninstalling DevCert...');
devcert.uninstall();
console.log('DevCert uninstalled.');