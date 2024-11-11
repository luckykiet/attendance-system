

// config.js
const APP_NAME = 'ATTENDANCE SYSTEM Admin'

const WEB_PUBLIC_URL = import.meta.env.DEV ? 'https://vcap.me:4000' : 'https://ruano.cz'

export const CONFIG = {
  APP_NAME: APP_NAME,
  API_URL: '/api/v1',
  JWT_SECRET: '***REMOVED***',
  SUPPORTED_CONTENT_TYPES: ['json', 'x-www-form-urlencoded'],
  DEFAULT_TIMEZONE: 'Europe/Prague',
  RECAPTCHA_SITE_KEY: '6LcFllwpAAAAAOCsFwof_H2GlgbQyHdCixMUgDs4',
  WEB_PUBLIC_URL: WEB_PUBLIC_URL,
}
