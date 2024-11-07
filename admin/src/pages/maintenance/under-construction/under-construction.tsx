import { Box, Button, Container, Grid2, Stack, Typography } from '@mui/material';

import { Link } from 'react-router-dom';
import construction from '@/assets/images/maintenance/img-cunstruct-1.svg';
import constructionBg from '@/assets/images/maintenance/img-cunstruct-1-bg.png';
import constructionbottom from '@/assets/images/maintenance/img-cunstruct-1-bottom.svg';
import useTranslation from '@/hooks/useTranslation';

// ==============================|| UNDER CONSTRUCTION ||============================== //

function UnderConstruction() {
  const { t } = useTranslation();
  return (
    <Box sx={{ minHeight: '100vh', backgroundImage: `url(${constructionBg})`, backgroundSize: '100%', backgroundRepeat: 'no-repeat' }}>
      <Container
        fixed
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Grid2
          container
          spacing={3}
          alignItems="center"
          justifyContent="center"
          sx={{
            py: 2,
            backgroundImage: `url(${constructionbottom})`,
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom'
          }}
        >
          <Grid2 size={{ md: 6 }}>
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
          <Grid2 size={{ md: 6 }}>
            <Box sx={{ width: { xs: 300, sm: 374 } }}>
              <img src={construction} alt="under construction" style={{ width: '100%', height: 'auto' }} />
            </Box>
          </Grid2>
        </Grid2>
      </Container>
    </Box >
  );
}

export default UnderConstruction;
