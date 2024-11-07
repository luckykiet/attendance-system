import { Box, Grid2 } from '@mui/material';

import AuthCard from './AuthCard';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const AuthWrapper = ({ children }: Props) => (
  <Box sx={{ minHeight: '100vh' }}>
    <Grid2
      container
      direction="column"
      justifyContent="center"
      sx={{
        minHeight: '100vh'
      }}
    >
      <Grid2 size={{ xs: 12 }}>
        <Grid2
          size={{ xs: 12 }}
          container
          justifyContent="center"
          alignItems="center"
          sx={{ minHeight: { xs: 'calc(100vh - 210px)', sm: 'calc(100vh - 134px)', md: 'calc(100vh - 112px)' } }}
        >
          <Grid2>
            <AuthCard>{children}</AuthCard>
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  </Box >
);

export default AuthWrapper;
