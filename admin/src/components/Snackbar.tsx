import { Add, Warning2 } from 'iconsax-react';
import { Alert, Button, Stack } from '@mui/material';
import { useSnackbarStore, useSnackbarStoreActions } from '@/stores/snackbar';

import IconButton from '@mui/material/IconButton';
import MuiSnackbar from '@mui/material/Snackbar';
import { SyntheticEvent } from 'react';
import useTranslation from '@/hooks/useTranslation';

// ==============================|| SNACKBAR ||============================== //

const Snackbar = () => {
  const { actionButton, anchorOrigin, alert, close, message, open, variant } = useSnackbarStore();
  const { closeSnackbar } = useSnackbarStoreActions();
  const { t } = useTranslation();
  const handleClose = (_event: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    closeSnackbar();
  };

  return (
    <>
      {/* default snackbar */}
      {variant === 'default' && (
        <MuiSnackbar
          anchorOrigin={anchorOrigin}
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          message={message}
          action={
            <>
              <Button color="secondary" size="small" onClick={handleClose}>
                {t('misc_undo').toUpperCase()}
              </Button>
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <Add style={{ transform: 'rotate(45deg)' }} />
              </IconButton>
            </>
          }
        />
      )}

      {/* alert snackbar */}
      {variant === 'alert' && (
        <MuiSnackbar
          anchorOrigin={anchorOrigin}
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
        >
          <Alert
            variant={alert.variant}
            color={alert.color}
            action={
              <Stack direction="row" alignItems="center">
                {actionButton !== false && (
                  <Button color={alert.color} size="small" onClick={handleClose}>
                    {t('misc_undo').toUpperCase()}
                  </Button>
                )}
                {close !== false && (
                  <IconButton size="small" aria-label="close" color={alert.color} onClick={handleClose}>
                    <Add style={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                )}
              </Stack>
            }
            sx={{
              ...alert.sx,
              ...(alert.variant === 'outlined' && {
                bgcolor: 'background.default'
              })
            }}
            icon={alert.icon ? alert.icon : <Warning2 />}
          >
            {message}
          </Alert>
        </MuiSnackbar>
      )}
    </>
  );
};

export default Snackbar;
