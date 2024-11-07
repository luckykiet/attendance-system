import { Box, Button, Grid2, Stack, Typography } from '@mui/material';

import { Link } from 'react-router-dom';
import construction from '@/assets/images/maintenance/img-construction-2.svg';
import useTranslation from '@/hooks/useTranslation';

// ==============================|| UNDER CONSTRUCTION ||============================== //

function UnderConstruction() {
  const { t } = useTranslation();
  return (
    <Grid2 container spacing={3} direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', py: 2 }}>
      <Grid2 size={{ xs: 12 }}>
        <Box sx={{ width: { xs: 300, sm: 374 } }}>
          <img src={construction} alt="under construction" style={{ width: '100%', height: 'auto' }} />
        </Box>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        <Stack spacing={2} justifyContent="center" alignItems="center">
          <Typography align="center" variant="h1">
            Under Construction
          </Typography>
          <Typography color="textSecondary" align="center" sx={{ width: '85%' }}>
            Hey! Please check out this site later. We are doing some maintenance on it right now.
          </Typography>
          <Button component={Link} to={'/'} variant="contained">
            {t('misc_back_to_app', { capitalize: true })}
          </Button>
        </Stack>
      </Grid2>
    </Grid2>
  );
}

export default UnderConstruction;
