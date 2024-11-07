import { AppBar, AppBarProps, Toolbar, useMediaQuery } from '@mui/material';

import { ReactNode, useMemo } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

import AppBarStyled from './AppBarStyled';
import HeaderContent from './HeaderContent';

const Header = () => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));


  const headerContent = useMemo(() => <HeaderContent />, []);


  // common header
  const mainHeader: ReactNode = (
    <Toolbar sx={{ px: { xs: 2, sm: 4.5, lg: 8 } }}>
      {headerContent}
    </Toolbar>
  );

  const appBar: AppBarProps = {
    position: 'fixed',
    elevation: 0,
    sx: {
      bgcolor: alpha(theme.palette.background.default, 0.8),
      backdropFilter: 'blur(8px)',
      zIndex: 1200,
      width: { xs: '100%' }
    }
  };

  return (
    <>
      {!downLG ? (
        <AppBarStyled {...appBar}>
          {mainHeader}
        </AppBarStyled>
      ) : (
        <AppBar {...appBar}>{mainHeader}</AppBar>
      )}
    </>
  );
};

export default Header;
