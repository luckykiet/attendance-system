import { DefaultConfigProps } from '@/types/config';

import CsFlag from '@/assets/images/flags/cs.svg?react';
import EnFlag from '@/assets/images/flags/en.svg?react';
import ViFlag from '@/assets/images/flags/vi.svg?react';

export const BASE_NAME = 'ATTENDANCE SYSTEM Admin';

export const HOSTNAME = window.location.hostname.split('.').slice(-2).join('.');
export const HOST = HOSTNAME + (window.location.port ? `:${window.location.port}` : '');
export const DEFAULT_LOCALE = 'cs';
export const LOCALES = [
  { key: 'cs', name: 'čeština', state: 'Česká republika', logo: CsFlag },
  { key: 'en', name: 'english', state: 'US, UK', logo: EnFlag },
  { key: 'vi', name: 'tiếng việt', state: 'Việt Nam', logo: ViFlag }
];

export const ROLES = ['Admin', 'Manager'];
export const APP_DEFAULT_PATH = '/admin';

const config: DefaultConfigProps = {
  fontFamily: `Inter var`,
  i18n: 'cs',
};

export default config;
