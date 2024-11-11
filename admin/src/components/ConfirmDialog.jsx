import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import PropTypes from 'prop-types';
import useTranslation from '@/hooks/useTranslation'

export default function ConfirmDialog({
  title,
  mainText,
  subText,
  showConfirmBox,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()

  const handleCancel = (e) => {
    e.stopPropagation()
    onCancel()
  }
  const handleConfirm = (e) => {
    e.stopPropagation()
    onConfirm()
  }
  return (
    <Dialog
      open={showConfirmBox}
      onClose={handleCancel}
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle
        sx={{ fontWeight: 700 }}
        variant="h5"
        align="center"
        color={'error'}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{mainText}</DialogContentText>
        <DialogContentText>{subText}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <ButtonGroup fullWidth>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCancel}
            autoFocus
            fullWidth
          >
            {t('misc_cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirm}
            fullWidth
          >
            {t('misc_confirm')}
          </Button>
        </ButtonGroup>
      </DialogActions>
    </Dialog>
  )
}

ConfirmDialog.propTypes = {
  title: PropTypes.string,
  mainText: PropTypes.string,
  subText: PropTypes.string,
  showConfirmBox: PropTypes.bool,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
}