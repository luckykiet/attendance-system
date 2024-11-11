import csJson from '@/locales/cs.json'
import enJson from '@/locales/en.json'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import viJson from '@/locales/vi.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...enJson } },
    cs: { translation: { ...csJson } },
    vi: { translation: { ...viJson } },
  },
  lng: window.localStorage.getItem('i18n-lang')
    ? `${window.localStorage.getItem('i18n-lang')}`
    : 'cs',
  fallbackLng: 'cs',

  interpolation: {
    escapeValue: false,
  },
})
export default i18n
