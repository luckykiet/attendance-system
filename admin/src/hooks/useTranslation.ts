import { capitalizeFirstLetterOfString } from '@/utils';
import { useIntl } from 'react-intl';

const useTranslation = () => {
  const intl = useIntl();
  const t = (key: string, options?: { capitalize?: boolean }) => {
    const { capitalize = true } = options || {};
    try {
      return capitalize ? capitalizeFirstLetterOfString(intl.formatMessage({ id: key })) : intl.formatMessage({ id: key });
    } catch {
      return capitalize ? capitalizeFirstLetterOfString(key) : key;
    }
  };
  return { t };
};

export default useTranslation;
