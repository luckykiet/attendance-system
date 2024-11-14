import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import csJson from '@/locales/cs.json'
import enJson from '@/locales/en.json'
import viJson from '@/locales/vi.json'

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem("language");

    if (!savedLanguage) {
        savedLanguage = getLocales()[0].languageCode || 'cs';
    }

    i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        resources: {
            en: { translation: { ...enJson } },
            cs: { translation: { ...csJson } },
            vi: { translation: { ...viJson } },
        },
        lng: savedLanguage,
        fallbackLng: 'cs',
        interpolation: {
            escapeValue: false,
        },
    });
};

initI18n();

export default i18n;