import { Box, useMediaQuery } from '@mui/material';

import Localization from './Localization';
import Notification from './Notification';
import { Theme } from '@mui/material/styles';
import { useMemo } from 'react';
import useLocaleStore from '@/stores/locale';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = () => {
  const { locale } = useLocaleStore();

  const downLG = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localization = useMemo(() => <Localization />, [locale]);

  return (
    <>
      {!downLG && localization}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}
      <Notification />
    </>
  );
};

export default HeaderContent;
