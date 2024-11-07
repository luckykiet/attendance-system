import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { APP_DEFAULT_PATH } from './config';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Locales from '@/components/Locales';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Router from '@/routes';
import { RouterProvider } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      retryOnMount: false,
      retryDelay: 3000
    }
  }
});

const App = () => {
  if (!window.location.pathname.includes(APP_DEFAULT_PATH)) {
    const currentPathname = window.location.pathname;
    window.location.pathname = APP_DEFAULT_PATH + currentPathname;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
      <QueryClientProvider client={queryClient}>
        <Locales>
          {import.meta.env.MODE === 'development' && <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />}
          <RouterProvider router={Router()} />
        </Locales>
      </QueryClientProvider>
    </LocalizationProvider>
  );
};

export default App;
