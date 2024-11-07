import { Stack, Typography } from '@mui/material';

import packageJson from '../../../package.json';

// ==============================|| MAIN LAYOUT - FOOTER ||============================== //

const Footer = () => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: '24px 16px 0px', mt: 'auto' }}>
    <Typography variant="caption">
      {new Date().getFullYear()}&nbsp;©&nbsp;{packageJson.app.provider}
      &nbsp;
    </Typography>
  </Stack>
);

export default Footer;
