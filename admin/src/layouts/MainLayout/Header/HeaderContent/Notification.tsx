import {
  Badge,
  Box,
  ClickAwayListener,
  Link,
  Paper,
  Popper,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import { Notification } from 'iconsax-react';
import { useRef, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import MainCard from '@/components/MainCard';

import { useTheme } from '@mui/material/styles';
import useTranslation from '@/hooks/useTranslation';

const NotificationPage = () => {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [read] = useState(0);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  const iconBackColorOpen = 'secondary.200';
  const iconBackColor = 'secondary.100';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.5 }}>
      <IconButton
        color="secondary"
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        size="large"
        sx={{ color: 'secondary.main', bgcolor: open ? iconBackColorOpen : iconBackColor, p: 1 }}
      >
        <Badge badgeContent={read} color="success" sx={{ '& .MuiBadge-badge': { top: 2, right: 4 } }}>
          <Notification variant="Bold" />
        </Badge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [matchesXs ? -5 : 0, 9]
              }
            }
          ]
        }}
      >
        <Paper
          sx={{
            borderRadius: 1.5,
            width: '100%',
            minWidth: 285,
            maxWidth: 420,
            [theme.breakpoints.down('md')]: {
              maxWidth: 285
            }
          }}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <MainCard elevation={0} border={false}>
              {read > 0 && (
                <Stack spacing={1}>
                  <Typography variant="h5">{t('misc_notification', { capitalize: true })}</Typography>
                  <Link href="#" variant="h6" color="primary">
                    {t('misc_mark_all_read', { capitalize: true })}
                  </Link>
                </Stack>
              )}
              <Stack direction="row" justifyContent="center">
                <Link href="#" variant="h6" color="primary">
                  {t('misc_view_all', { capitalize: true })}
                </Link>
              </Stack>
            </MainCard>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </Box>
  );
};

export default NotificationPage;
