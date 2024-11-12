const APP_NAME = 'ATTENDANCE SYSTEM Admin'

export const HOSTNAME = window.location.hostname.split('.').slice(-2).join('.');
export const HOST = HOSTNAME + (window.location.port ? `:${window.location.port}` : '');

export const CONFIG = {
  APP_NAME: APP_NAME,
  HOSTNAME: HOSTNAME,
  HOST: HOST,
  JWT_SECRET: '***REMOVED***',
  RECAPTCHA_SITE_KEY: '***REMOVED***',
  GOOGLE_MAPS_API_KEY: '***REMOVED***',
  WEB_PUBLIC_URL: HOSTNAME,
}