import axiosServices from '@/utils/axios';

import enJson from '@/locales/en.json';
import csJson from '@/locales/cs.json';
import viJson from '@/locales/vi.json';

const localTranslations = {
    en: enJson,
    cs: csJson,
    vi: viJson,
};


const axios = axiosServices('/api');

export const getLocale = async (lang) => {
    const {
        data: { success, msg },
    } = await axios.get(`/locale/${lang}`);

    if (!success) {
        return localTranslations[lang] || localTranslations['en'];
    }

    return {...localTranslations[lang], ...msg};
};