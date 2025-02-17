const fs = require('fs');
const devcert = require('devcert');
const { CONFIG } = require('../configs');
const os = require('os');
function checkPrivileges() {
    if (os.platform() === 'win32') {
        try {
            fs.accessSync('C:\\Windows\\System32', fs.constants.W_OK);
            return true;
        } catch {
            console.error('This script must be run as Administrator.');
            process.exit(1);
        }
    } else {
        if (process.getuid && process.getuid() !== 0) {
            console.error('This script must be run with sudo.');
            process.exit(1);
        }
    }
}
checkPrivileges();

const defaultDomains = CONFIG.domain || 'vcap.me';
const domains = [defaultDomains];

if (CONFIG.subdomain) {
    domains.push(`${CONFIG.subdomain}.${defaultDomains}`);
}

const hostsFilePath = process.platform === 'win32' 
    ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' 
    : '/etc/hosts';

const backupHostsFilePath = `${hostsFilePath}.bak`;
fs.copyFileSync(hostsFilePath, backupHostsFilePath);
console.log('Hosts file backed up.');

const hostsFileContent = fs.readFileSync(hostsFilePath, 'utf8');
const updatedHostsContent = hostsFileContent
    .split('\n')
    .filter(line => {
        if (line.trim().startsWith('#')) return true;
        
        return !domains.some(domain => {
            const domainRegex = new RegExp(`(^|\\s)${domain}(\\s|$)`);
            return domainRegex.test(line);
        });
    })
    .join('\n');

fs.writeFileSync(hostsFilePath, updatedHostsContent.trim() + '\n', 'utf8');
console.log('Hosts file updated to remove specified domains:', domains.join(', '));

const configuredDomains = devcert.configuredDomains();
devcert.removeDomain(configuredDomains);
console.log('DevCert removed for domains:', configuredDomains.join(', '));
console.log('Uninstalling DevCert...');
devcert.uninstall();
console.log('DevCert uninstalled.');
process.exit(0);
