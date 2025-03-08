const devcert = require('devcert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { CONFIG } = require('../configs');
const execSync = require('child_process').execSync;

const defaultDomains = CONFIG.domain || 'vcap.me';
const domains = [defaultDomains];

const generateDevCert = async () => {
    const keyPath = path.resolve('./certs/tls.key');
    const certPath = path.resolve('./certs/tls.cert');
    
    if (CONFIG.subdomain) {
        domains.push(`${CONFIG.subdomain}.${defaultDomains}`);
    }

    console.log('Configuring HTTPS for domains:', domains.join(', '));

    try {
        const { key, cert } = await devcert.certificateFor(domains);
        
        // Ensure the certs directory exists
        if (!fs.existsSync('./certs')) {
            fs.mkdirSync('./certs', { recursive: true });
        }

        // Write new key and cert, replacing any existing ones
        fs.writeFileSync(keyPath, key);
        fs.writeFileSync(certPath, cert);

        console.log('Configured HTTPS for domains:', domains.join(', '));
        addDomainsToHosts(domains);

        process.exit(0);
    } catch (error) {
        console.error('Error configuring HTTPS certificates:', error);
    }
};

const addDomainsToHosts = (domains) => {
    const hostsFile = os.platform() === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';

    domains.forEach(domain => {
        try {
            const hostsContent = fs.readFileSync(hostsFile, 'utf8');
            const domainExists = hostsContent.split('\n').some(line => 
                new RegExp(`^\\s*127\\.0\\.0\\.1\\s+${domain}\\s*$`).test(line)
            );

            if (!domainExists) {
                console.log(`Adding ${domain} to ${hostsFile}`);
                const command = os.platform() === 'win32' 
                    ? `echo 127.0.0.1 ${domain} >> ${hostsFile}`
                    : `echo "127.0.0.1 ${domain}" | sudo tee -a ${hostsFile}`;
                
                execSync(command, { stdio: 'inherit' });
                console.log(`Successfully added ${domain} to ${hostsFile}`);
            } else {
                console.log(`${domain} already exists in ${hostsFile}`);
            }
        } catch (error) {
            console.error(`Failed to add ${domain} to ${hostsFile}:`, error);
        }
    });
};

generateDevCert();
