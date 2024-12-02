# ATTENDENCE SYSTEM

- v1.0.0
- Tuan Kiet Nguyen, 2024
- ngntuankiet@gmail.com
## Deployment

- [Admin Interface](https://attendance.batatas.cz)
- [Google Play](https://play.google.com/store/apps/details?id=cz.ethereal.gokasaworkforce&pcampaignid=web_share)
- [Apple App Store](https://play.google.com/store/apps/details?id=cz.ethereal.gokasaworkforce&pcampaignid=web_share)
  
## Descriptions

System to monitor attendances using mobile phone.

## Requirements

- NodeJS v20.9.0 or higher
- Mongodb
- OpenSSL (for Windows follow [this link](https://www.sslmentor.cz/napoveda/openssl-pro-windows-a-mac))

## Windows

[Download OpenSSL](https://slproweb.com/products/Win32OpenSSL.html)

### Setting Up OpenSSL Path Environment Variable on Windows

To ensure OpenSSL works correctly in the Windows Command Prompt, you must configure the **System Variable: Path** to include the path to the `/bin` directory of the OpenSSL installation.

#### Windows 8
1. Go to **System** → **Advanced System Settings** → **Environment Variables**.
2. Under **System Variables**, find and select **Path**.
3. Edit the **Path** variable and append the following (separated by a semicolon `;`):
   
Example: 
```
C:\Program Files\to\OpenSSL-Win64\bin
```

#### Windows 11
1. Go to **Settings** → **About** → **Advanced System Settings**.
2. In the **System Properties** dialog box, click on **Environment Variables**.
3. Locate **Path** under **System Variables** and click **Edit**.
4. Click **New** and add the path to the OpenSSL `/bin` directory:

### Installation

1. Download [NodeJS v20.9.0](https://nodejs.org/en/blog/release/v20.9.0)
2. Download or clone this repository:
```
git clone https://github.com/luckykiet/attendance-system.git
```
3. Install dependencies 
```
cd attendance-system
npm install -g yarn
yarn install
yarn install-all
```
4. Generate Google Recaptcha v3 Client and Secret keys - [Instruction](https://developers.google.com/recaptcha/docs/v3)

### Development

As default for development system will use _vcap.me_ domain
1. Setup configs files

[Admin](admin/src/configs/config.jsx)
```
JWT_SECRET - a secret that use to sign tokens, MUST be same as server
RECAPTCHA_SITE_KEY - generated from Google Recaptcha v3
GOOGLE_MAPS_API_KEY - generated from Google Maps API
MOBILE_INTENT - scheme of mobile app
PROXY_URL - only works in development; set if you use tunneling
```
[Server](server/configs/config.js)
```
jwtSecret - a secret that use to sign tokens, MUST be same as server
grecaptchaSecret - generated from Google Recaptcha v3
mobile_intent - scheme of mobile app
proxy_domain - only works in development; set if you use tunneling
mail_transport: {
    service: 'gmail', --- mail service
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: '', --- email STMP
        clientId: '',
        clientSecret: '',
        refreshToken: ''
    }
},
```

2. Run app
```
yarn devhttps
```

### Development

As default for development system will use _vcap.me_ domain
1. Setup configs files

[Admin](admin/src/configs/config.jsx)
```
JWT_SECRET - a secret that use to sign tokens, MUST be same as server
RECAPTCHA_SITE_KEY - generated from Google Recaptcha v3
GOOGLE_MAPS_API_KEY - generated from Google Maps API
MOBILE_INTENT - scheme of mobile app
PROXY_URL - only works in development; set if you use tunneling
```
[Server](server/configs/config.js)
```
jwtSecret - a secret that use to sign tokens, MUST be same as server
grecaptchaSecret - generated from Google Recaptcha v3
mobile_intent - scheme of mobile app
proxy_domain - only works in development; set if you use tunneling
mail_transport: {
    service: 'gmail', --- mail service
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: '', --- email STMP
        clientId: '',
        clientSecret: '',
        refreshToken: ''
    }
},
```

2. Run app and mobile app
```
On first terminal:
yarn devhttps

On second terminal:
yarn devmobile
```

### Production

1. Setup configs files

[Admin](admin/src/configs/config.jsx)
```
JWT_SECRET - a secret that use to sign tokens, MUST be same as server
RECAPTCHA_SITE_KEY - generated from Google Recaptcha v3
GOOGLE_MAPS_API_KEY - generated from Google Maps API
MOBILE_INTENT - scheme of mobile app
```
[Server](server/configs/config.js)
```
jwtSecret - a secret that use to sign tokens, MUST be same as server
grecaptchaSecret - generated from Google Recaptcha v3
mobile_intent - scheme of mobile app
mail_transport: {
    service: 'gmail', --- mail service
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: '', --- email STMP
        clientId: '',
        clientSecret: '',
        refreshToken: ''
    }
},
```

2. Deploy folder _server_ onto your server running NodeJS
3. Build and deploy _Admin_, it will be served by server
```
yarn build
yarn deploy
```
4. [Mobile instructions](/mobile/README.md)
5. [Local instructions](/local/README.md)