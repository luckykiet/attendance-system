import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Router from '@/routes';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as ThemeProviderStyles } from '@mui/styles';
import { createEmotionCache } from '@/utils/createEmotionCache';
import { createTheme } from '@/theme';
import i18n from '@/i18n';
import PropTypes from 'prop-types';
import LoadingCircle from './components/LoadingCircle';
import { useConfigStoreActions } from '@/stores/config';
import { getConfig } from '@/api/config';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      retryOnMount: false,
      retryDelay: 3000,
      staleTime: Infinity,
    },
  },
});

const clientSideEmotionCache = createEmotionCache();

export default function App(props) {
  const { emotionCache = clientSideEmotionCache } = props;
  const theme = createTheme();

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <ThemeProviderStyles theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <ConfigFetcher />
              <RouterProvider router={Router()} />
            </I18nextProvider>
            {import.meta.env.MODE === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </ThemeProviderStyles>
      </ThemeProvider>
    </CacheProvider>
  );
}

App.propTypes = {
  emotionCache: PropTypes.object,
};

const ConfigFetcher = () => {
  const setConfig = useConfigStoreActions();

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config) {
      setConfig(config);
    }
  }, [config, setConfig]);

  if (isLoading) {
    return <LoadingCircle />;
  }

  return null;
}
