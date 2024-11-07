import { LOCALES } from '@/config';

export type I18n = (typeof LOCALES)[number]['key'];
export type FontFamily =
  | `Inter var`
  | `'Inter', sans-serif`
  | `'Poppins', sans-serif`
  | `'Roboto', sans-serif`
  | `'Public Sans', sans-serif`;

export type DefaultConfigProps = {
  fontFamily: FontFamily;
  i18n: I18n;
};