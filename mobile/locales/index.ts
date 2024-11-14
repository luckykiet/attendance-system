import csIcon from '@/assets/flags/cs.svg';
import enIcon from '@/assets/flags/en.svg';
import viIcon from '@/assets/flags/vi.svg';

import { supportedLocales as configSupportedLocales, days as configDays } from './config.mjs';

const supportedLocalesIcons = {
  en: enIcon,
  vi: viIcon,
  cs: csIcon,
} as const;

export const LOCALES = Object.entries(configSupportedLocales).map(([key, value]) => ({
  key,
  name: value,
  icon: supportedLocalesIcons[key as keyof typeof supportedLocalesIcons],
}));

export const days = configDays;
