import { capitalizeFirstLetterOfString } from '@/utils';
import { useTranslation as useReactTranslation } from 'react-i18next';

export default function useTranslation(options = { capitalize: true }) {
    const { t: originalT, ...rest } = useReactTranslation();

    const t = (key, tOptions) => {
        const translatedString = originalT(key, tOptions);
        return options.capitalize ? capitalizeFirstLetterOfString(translatedString) : translatedString;
    };

    return { t, ...rest };
}
