const fs = require('fs');
const devcert = require('devcert');
const { CONFIG } = require('../configs');
const defaultDomains = CONFIG.domain || 'vcap.me';
const domains = [defaultDomains];

if (CONFIG.admin_subdomain) {
    domains.push(`${CONFIG.admin_subdomain}.${defaultDomains}`);
}
if (CONFIG.subdomain) {
    domains.push(`${CONFIG.subdomain}.${defaultDomains}`);
}

// Path to the hosts file
const hostsFilePath = process.platform === 'win32' 
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
    : '/etc/hosts';

// Backup the hosts file
const backupHostsFilePath = `${hostsFilePath}.bak`;
fs.copyFileSync(hostsFilePath, backupHostsFilePath);
console.log('Hosts file backed up.');

// Get domains configured by devcert
const configuredDomains = devcert.configuredDomains();

// Read the hosts file content
let hostsFileContent = fs.readFileSync(hostsFilePath, 'utf8');

// Remove entries for configured domains
[...configuredDomains, ...domains].forEach(domain => {
    const domainRegex = new RegExp(`^.*\\b${domain}\\b.*$`, 'gm');
    hostsFileContent = hostsFileContent.replace(domainRegex, '');
});

// Write the updated content back to the hosts file
fs.writeFileSync(hostsFilePath, hostsFileContent.trim() + '\n', 'utf8');
console.log('Hosts file updated to remove devcert domains:', configuredDomains.join(', '));

// Uninstall devcert configuration
devcert.removeDomain(configuredDomains);
console.log('DevCert removed for domains:', configuredDomains.join(', '));
console.log('Uninstalling DevCert...');
devcert.uninstall();
console.log('DevCert uninstalled.');
process.exit(0);
