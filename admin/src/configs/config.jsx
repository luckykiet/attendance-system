const APP_NAME = 'ATTENDANCE SYSTEM Admin';
const MOBILE_INTENT = 'attendance://';

export const HOSTNAME = window.location.hostname.split('.').slice(-2).join('.');
export const HOST = HOSTNAME + (window.location.port ? `:${window.location.port}` : '');
export const PROTOCOL = window.location.protocol + '//';
export const PROXY_URL = '';

export const CONFIG = {
  APP_NAME: APP_NAME,
  HOSTNAME: HOSTNAME,
  HOST: HOST,
  PROTOCOL: PROTOCOL,
  JWT_SECRET: '',
  RECAPTCHA_SITE_KEY: '',
  GOOGLE_MAPS_API_KEY: '',
  WEB_PUBLIC_URL: HOSTNAME,
  MOBILE_INTENT: MOBILE_INTENT,
};
