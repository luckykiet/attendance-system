import { Box, Container, Toolbar } from '@mui/material';

import Footer from './Footer';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';

const MainLayout = () => {

  return (
    <RootLayout>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Toolbar sx={{ mt: 'inherit', mb: 'inherit' }} />
          <Container
            maxWidth={false}
            sx={{
              xs: 0,
              position: 'relative',
              minHeight: 'calc(100vh - 110px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Outlet />
            <Footer />
          </Container>
        </Box>
      </Box>
    </RootLayout>
  );
};

export default MainLayout;
