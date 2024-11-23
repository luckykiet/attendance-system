const APP_NAME = 'ATTENDANCE SYSTEM Admin';
const MOBILE_INTENT = 'gowork://';
const IS_USING_RECAPTCHA = true;

export const HOSTNAME = window.location.hostname;
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
  IS_USING_RECAPTCHA: IS_USING_RECAPTCHA,
};
