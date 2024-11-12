import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import useTranslation from '@/hooks/useTranslation';
import { useConfirmBox, useResetConfirmBox } from '@/stores/confirm';

export default function ConfirmDialog() {
  const { t } = useTranslation();
  const { showConfirmBox, title, mainText, subText, onConfirm, onCancel } = useConfirmBox();
  const resetConfirmBox = useResetConfirmBox();

  const handleCancel = (e) => {
    e.stopPropagation();
    onCancel && onCancel();
    resetConfirmBox();
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    onConfirm && onConfirm();
    resetConfirmBox();
  };

  return (
    <Dialog open={showConfirmBox} onClose={handleCancel} onClick={(e) => e.stopPropagation()}>
      <DialogTitle sx={{ fontWeight: 700 }} variant="h5" align="center" color="error">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{mainText}</DialogContentText>
        <DialogContentText>{subText}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <ButtonGroup fullWidth>
          <Button variant="contained" color="primary" onClick={handleCancel} autoFocus fullWidth>
            {t('misc_cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirm} fullWidth>
            {t('misc_confirm')}
          </Button>
        </ButtonGroup>
      </DialogActions>
    </Dialog>
  );
}
