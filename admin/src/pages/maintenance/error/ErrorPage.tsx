import { Button, Grid2, Stack, Typography, useMediaQuery } from '@mui/material';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { useTheme } from '@mui/material/styles';
import useTranslation from '@/hooks/useTranslation';

// ==============================|| ERROR 404 ||============================== //

const Error404 = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  return (
    <>
      <Grid2
        container
        spacing={10}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '100vh', pt: 2, pb: 1, overflow: 'hidden' }}
      >
        <Grid2 size={{ xs: 12 }}>
          <Stack spacing={2} justifyContent="center" alignItems="center">
            <Typography variant="h1">{t('err_page_not_found')}</Typography>
            <Typography variant="body1" color="textSecondary" align="center" sx={{ width: { xs: '73%', sm: '61%' } }}>
              {message}
            </Typography>
            <Button component={Link} to={'/'} variant="contained">
              {t('misc_back_to_app', { capitalize: true })}
            </Button>
          </Stack>
        </Grid2>
      </Grid2 >
    </>
  );
};

// ==============================|| ERROR 500 ||============================== //
const Error500 = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid2 container direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: '100vh' }} spacing={3}>
      <Grid2 size={{ xs: 12 }}>
        <Stack justifyContent="center" alignItems="center">
          <Typography align="center" variant={matchDownSM ? 'h2' : 'h1'}>
            {t('misc_error')}
          </Typography>
          <Typography color="textSecondary" variant="body1" align="center" sx={{ width: { xs: '73%', sm: '70%' }, mt: 1 }}>
            {message}
          </Typography>
          <Button component={Link} to={'/'} variant="contained" sx={{ textTransform: 'none', mt: 4 }}>
            {t('misc_back_to_app', { capitalize: true })}
          </Button>
        </Stack>
      </Grid2>
    </Grid2 >
  );
};

const ErrorPage = () => {
  const error = useRouteError();
  const { t } = useTranslation();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <Error404 message={`${error.status} - ${t('err_page_not_found')}!`} />;
    }

    if (error.status === 401) {
      return <Error404 message={`${error.status} - ${t('err_no_permission')}!`} />;
    }

    if (error.status === 503) {
      return <Error500 message={`${error.status} - ${t('err_failed_api')}!`} />;
    }

    if (error.status === 418) {
      return <>🫖</>;
    }
  }

  return <Error500 message={error instanceof Error ? error.message : `${t('err_unknown_error')}!`} />;
};

export default ErrorPage;
