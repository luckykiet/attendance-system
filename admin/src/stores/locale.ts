import { create } from 'zustand';

import { I18n } from '@/types/config';
import { LocaleStore } from '@/types/zustand/locale';
import { LOCALES, DEFAULT_LOCALE } from '@/config';

const loadLocaleData = async (locale: I18n) => {
    const locales = LOCALES.map((l) => l.key);
    if (locales.includes(locale)) {
        return import(`@/locales/${locale}.json`);
    } else {
        return import(`@/locales/${DEFAULT_LOCALE}.json`);
    }
};

const useLocaleStore = create<LocaleStore>((set) => ({
    locale: DEFAULT_LOCALE,
    messages: undefined,
    setLocale: (locale) => set({ locale }),
    loadMessages: async (locale) => {
        const data = await loadLocaleData(locale);
        set({ messages: data.default });
    },
}));

export default useLocaleStore;
