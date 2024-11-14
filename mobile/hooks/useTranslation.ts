import { capitalizeFirstLetterOfString } from '@/utils';
import { i18n } from 'i18next';
import { useTranslation as useReactTranslation } from 'react-i18next';

type UseTranslationOptionsWithCapitalize = {
    capitalize?: boolean;
};

type CustomUseTranslationResponse = {
    t: (key: string, tOptions?: Record<string, unknown>) => string;
    i18n: i18n;
    ready: boolean;
};

export default function useTranslation(
    options: UseTranslationOptionsWithCapitalize = { capitalize: true }
): CustomUseTranslationResponse {
    const { t: originalT, i18n, ready } = useReactTranslation();

    const t = (key: string, tOptions?: Record<string, unknown>): string => {
        const translatedString = originalT(key, tOptions);
        return options.capitalize ? capitalizeFirstLetterOfString(translatedString) : translatedString;
    };

    return { t, i18n, ready };
}
