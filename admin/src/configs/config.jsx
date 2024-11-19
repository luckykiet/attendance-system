const APP_NAME = 'ATTENDANCE SYSTEM Admin';
const MOBILE_INTENT = 'gowork://';
const IS_USING_RECAPTCHA = true;

export const HOSTNAME = window.location.hostname.split('.').slice(-2).join('.');
export const HOST = HOSTNAME + (window.location.port ? `:${window.location.port}` : '');
export const PROTOCOL = window.location.protocol + '//';
export const PROXY_URL = 'https://hkj8bh1h-4000.euw.devtunnels.ms';

export const CONFIG = {
  APP_NAME: APP_NAME,
  HOSTNAME: HOSTNAME,
  HOST: HOST,
  PROTOCOL: PROTOCOL,
  JWT_SECRET: '***REMOVED***',
  RECAPTCHA_SITE_KEY: '***REMOVED***',
  GOOGLE_MAPS_API_KEY: '***REMOVED***',
  WEB_PUBLIC_URL: HOSTNAME,
  MOBILE_INTENT: MOBILE_INTENT,
  IS_USING_RECAPTCHA: IS_USING_RECAPTCHA,
};
