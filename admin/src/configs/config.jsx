const APP_NAME = 'ATTENDANCE SYSTEM Admin'

export const HOSTNAME = window.location.hostname.split('.').slice(-2).join('.');
export const HOST = HOSTNAME + (window.location.port ? `:${window.location.port}` : '');

export const CONFIG = {
  APP_NAME: APP_NAME,
  HOSTNAME: HOSTNAME,
  HOST: HOST,
  JWT_SECRET: '',
  RECAPTCHA_SITE_KEY: '',
  WEB_PUBLIC_URL: HOSTNAME,
}
