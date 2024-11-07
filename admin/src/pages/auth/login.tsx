import { Grid2, Stack, Typography } from '@mui/material';

import AuthLogin from '@/sections/auth/auth-forms/AuthLogin';
import AuthWrapper from '@/sections/auth/AuthWrapper';
import { Link } from 'react-router-dom';
import Logo from '@/components/logo';
import useTranslation from '@/hooks/useTranslation';

// ================================|| LOGIN ||================================ //

const Login = () => {
  const { t } = useTranslation();
  return (
    <AuthWrapper>
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
          <Logo />
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">{t('misc_login', { capitalize: true })}</Typography>
            <Typography
              component={Link}
              to={`/signup`}
              variant="body1"
              sx={{ textDecoration: 'none' }}
              color="primary"
            >
              {t('msg_do_not_have_account', { capitalize: true })}?
            </Typography>
          </Stack>
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <AuthLogin />
        </Grid2>
      </Grid2>
    </AuthWrapper >
  );
};

export default Login;
