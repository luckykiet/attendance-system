import { Box, Chip, Container, Stack, Toolbar, Typography, useMediaQuery, useScrollTrigger } from '@mui/material';
import { ReactElement, cloneElement, useMemo } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

import AppBar from '@mui/material/AppBar';
import Localization from '../MainLayout/Header/HeaderContent/Localization';
import Logo from '@/components/logo';
import packageJson from '../../../package.json';
import useLocaleStore from '@/stores/locale';

interface ElevationScrollProps {
  layout: string;
  children: ReactElement;
  window?: Window | Node;
}

function ElevationScroll({ children, window }: ElevationScrollProps) {
  const theme = useTheme();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 10,
    target: window ? window : undefined
  });

  return cloneElement(children, {
    style: {
      boxShadow: trigger ? '0 8px 6px -10px rgba(0, 0, 0, 0.5)' : 'none',
      backgroundColor: trigger ? alpha(theme.palette.background.default, 0.8) : alpha(theme.palette.background.default, 0.1)
    }
  });
}

interface Props {
  layout?: string;
}

const Header = ({ layout = 'landing', ...others }: Props) => {
  const theme = useTheme();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const { locale } = useLocaleStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localization = useMemo(() => <Localization />, [locale]);

  return (
    <ElevationScroll layout={layout} {...others}>
      <AppBar
        sx={{
          bgcolor: alpha(theme.palette.background.default, 0.1),
          backdropFilter: 'blur(8px)',
          color: theme.palette.text.primary,
          boxShadow: 'none'
        }}
      >
        <Container maxWidth="xl" disableGutters={matchDownMd}>
          <Toolbar sx={{ px: { xs: 1.5, sm: 4, md: 0, lg: 0 }, py: 1 }}>
            <Stack direction="row" sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} alignItems="center">
              <Typography component="div" sx={{ textAlign: 'left', display: 'inline-block' }}>
                <Logo to="/" />
              </Typography>
              <Chip
                label={packageJson.version}
                variant="outlined"
                size="small"
                color="secondary"
                sx={{ mt: 0.5, ml: 1, fontSize: '0.725rem', height: 20, '& .MuiChip-label': { px: 0.5 } }}
              />
            </Stack>
            <Stack
              direction="row"
              sx={{
                '& .header-link': { fontWeight: 500, '&:hover': { color: theme.palette.primary.main } },
                display: { xs: 'none', md: 'block' }
              }}
              spacing={3}
            >
              {localization}
            </Stack>
            <Box
              sx={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                display: { xs: 'flex', md: 'none' }
              }}
            >
              <Typography component="div" sx={{ textAlign: 'left', display: 'inline-block' }}>
                <Logo to="/" />
              </Typography>
              {localization}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ElevationScroll>
  );
};

export default Header;
