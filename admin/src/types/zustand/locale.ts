import { MessageFormatElement } from 'react-intl';
import { I18n } from '@/types/config';

export interface LocaleStore {
    locale: I18n;
    messages: Record<string, string> | Record<string, MessageFormatElement[]> | undefined;
    setLocale: (locale: I18n) => void;
    loadMessages: (locale: I18n) => Promise<void>;
}