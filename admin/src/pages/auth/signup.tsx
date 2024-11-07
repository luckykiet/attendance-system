import { Grid2, Stack, Typography } from '@mui/material';

import AuthWrapper from '@/sections/auth/AuthWrapper';
import { Link } from 'react-router-dom';
import Logo from '@/components/logo';
import useTranslation from '@/hooks/useTranslation';
import AuthSignup from '@/sections/auth/auth-forms/AuthSignup';

const Signup = () => {
  const { t } = useTranslation();
  return (
    <AuthWrapper>
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
          <Logo />
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">{t('misc_registration', { capitalize: true })}</Typography>
            <Typography
              component={Link}
              to={`/login`}
              variant="body1"
              sx={{ textDecoration: 'none' }}
              color="primary"
            >
              {t('msg_already_have_account', { capitalize: true })}?
            </Typography>
          </Stack>
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <AuthSignup />
        </Grid2>
      </Grid2>
    </AuthWrapper >
  );
};

export default Signup;
