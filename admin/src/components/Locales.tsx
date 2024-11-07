import React, { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import useLocaleStore from '@/stores/locale';
import { DEFAULT_LOCALE } from '@/config';

interface LocaleProviderProps {
  children: React.ReactNode;
}

const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const { locale, messages, loadMessages } = useLocaleStore();

  useEffect(() => {
    loadMessages(locale);
  }, [locale, loadMessages]);

  return (
    <>
      {messages && (
        <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages} onError={() => { }}>
          {children}
        </IntlProvider>
      )}
    </>
  );
};

export default LocaleProvider;
