import { Box, Container, Grid2, Typography } from '@mui/material';

import packageJson from '../../../package.json';
import { useTheme } from '@mui/material/styles';

const FooterBlock = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 2.4,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: 'secondary.200'
      }}
    >
      <Container>
        <Grid2 container spacing={2} alignItems="center">
          <Grid2 size={{ xs: 12, sm: 8 }}>
            <Typography>
              {new Date().getFullYear()}&nbsp;©&nbsp;{packageJson.app.provider}
              &nbsp;
            </Typography>
          </Grid2>
        </Grid2>
      </Container>
    </Box>
  );
};

export default FooterBlock;
