const nodemailer = require('nodemailer')
const DELAY_TIME = 5000
const { minify } = require('html-minifier-terser')
const { google } = require('googleapis')
const { CONFIG } = require('./configs')

const OAuth2 = google.auth.OAuth2

const template = (title, body) => {
  return `
  <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
          }
          h1 {
            color: #007bff;
            font-size: 24px;
          }
          p {
            margin: 0 0 15px;
            font-size: 16px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            color: #ffffff !important;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .content {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .subcopy {
            font-size: 0.9em;
            color: #555;
            margin-top: 20px;
            text-align: center;
          }
          .qr-code {
            text-align: center;
            margin: 25px 0;
          }
          .qr-code img {
            max-width: 150px;
            height: auto;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 8px;
          }
          .button-center {
            text-align: center;
            margin: 25px 0;
          }
          .footer {
            text-align: center;
            font-size: 0.85em;
            color: #999;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
         ${body}
      </body>
    </html>`;
};

const mailResetPasswordBody = (title, username, link) => {
  const content = `
  <div class="content">
        <h1>Hi ${username},</h1>
        <p>
          You recently requested to reset your password for your account at ${CONFIG.appName}. Use the button below to reset it.
          <strong>This password reset is only valid for 15 minutes.</strong>
        </p>
        <div class="button-center">
          <a href="${link}" target="_blank" class="button">Reset your password</a>
        </div>
        <p>
          If you did not request a password reset, please ignore this email or
          <a href="mailto:ngntuankiet@gmail.com">contact support</a> if you have questions.
        </p>
        <p>Thanks,<br />The ${CONFIG.appName} team</p>
        <div class="subcopy">
          <p>
            If you’re having trouble with the button above, copy and paste the URL below into your web browser:
          </p>
          <p><a href="${link}">${link}</a></p>
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} ${CONFIG.appName}. All rights reserved.
      </div>`;

  return template(title, content);
};

const mailQrCodeBody = ({ title, employee, retail, tokenId }) => {
  const appLink = `${CONFIG.host}/redirect?tokenId=${tokenId}`;
  const codeImageSource = `${CONFIG.host}/public/qrcode?text=${encodeURIComponent(appLink)}`;
  const content = `
  <div class="content">
        <h1>Hello ${employee.name},</h1>
        <p>
          Please scan the QR code below or click the link to complete your registration for ${retail.name}, IČO: ${retail.tin}, ${retail.address.street} ${retail.address.city} ${retail.address.zip}.
        </p>
        <div class="qr-code">
          <img src="${codeImageSource}" alt="QR Code" />
        </div>
        <div class="button-center">
          <a href="${appLink}" target="_blank" class="button">Complete Registration</a>
        </div>
        <p>Thank you,<br />The ${CONFIG.appName} team</p>
        <div class="subcopy">
          <p>If you’re having trouble with the link above, copy and paste the URL below into your web browser:</p>
          <a href="${appLink}">${appLink}</a>
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} ${CONFIG.appName}. All rights reserved.
      </div>`;

  return template(title, content);
};

const createTransporter = async () => {
  try {
    const oauth2Client = new OAuth2(
      CONFIG.mail_transport.auth.clientId,
      CONFIG.mail_transport.auth.clientSecret,
      'https://developers.google.com/oauthplayground'
    )
    oauth2Client.setCredentials({
      refresh_token: CONFIG.mail_transport.auth.refreshToken,
    })

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.log('*ERR: ', err)
          reject()
        }
        resolve(token)
      })
    })

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: CONFIG.mail_transport.auth.type,
        user: CONFIG.mail_transport.auth.user,
        accessToken,
        clientId: CONFIG.mail_transport.auth.clientId,
        clientSecret: CONFIG.mail_transport.auth.clientSecret,
        refreshToken: CONFIG.mail_transport.auth.refreshToken,
      },
    })
  } catch (err) {
    console.log(err)
  }
}

const sendMailResetPassword = async (to, username, link) => {
  const title = `Password reset for user: ${username}`
  const html = await minify(mailResetPasswordBody(title, username, link), {
    removeAttributeQuotes: true,
    minifyCSS: true,
    minifyURLs: true,
  })
  const options = {
    from: {
      name: 'no-reply',
      address: 'no-reply@gokarte.cz',
    },
    to: to,
    subject: title,
    text: title,
    html: html,
  }
  const transport = await createTransporter()
  const result = await transport.sendMail(options)
  await delay(DELAY_TIME)
  return result
}

const sendMailEmployeeDeviceRegistration = async (to, body) => {
  const { employee, retail, tokenId } = body
  const title = `${retail.name}, IČO:${retail.tin} - Registration: ${employee.name}`
  const html = await minify(mailQrCodeBody({ title, employee, retail, tokenId }), {
    removeAttributeQuotes: true,
    minifyCSS: true,
    minifyURLs: true,
  })
  const options = {
    from: {
      name: 'no-reply',
      address: 'no-reply@gokarte.cz',
    },
    to: to,
    subject: title,
    text: title,
    html: html,
  }
  const transport = await createTransporter()
  const result = await transport.sendMail(options)
  await delay(DELAY_TIME)
  return result
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  sendMailResetPassword,
  sendMailEmployeeDeviceRegistration
}
