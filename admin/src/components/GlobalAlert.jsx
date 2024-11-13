import { useAlertMessage, useSetAlertMessage } from '@/stores/root'
import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import SlideTransition from '@/components/Transitions'
import Snackbar from '@mui/material/Snackbar'
import useTranslation from '@/hooks/useTranslation'

// const alertMessage = { title: '', msg: '', duration: 4000, severity: 'error' }
export default function GlobalAlert() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [alertMessage, setAlertMessage] = [
    useAlertMessage(),
    useSetAlertMessage(),
  ]

  const handleClose = () => {
    setOpen(false)
    setAlertMessage({})
  }

  useEffect(() => {
    setOpen(!!alertMessage.msg)
  }, [alertMessage.msg])

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={open}
      autoHideDuration={alertMessage.duration || 4000}
      onClose={handleClose}
      disableWindowBlurListener={true}
      TransitionComponent={SlideTransition}
    >
      <Alert
        elevation={6}
        variant="filled"
        severity={alertMessage?.severity || 'info'}
        sx={{ width: '100%' }}
      >
        <AlertTitle>{alertMessage.title ? t(alertMessage.title) : t('misc_notification')}</AlertTitle>
        {t(alertMessage.msg)}
      </Alert>
    </Snackbar>
  )
}
