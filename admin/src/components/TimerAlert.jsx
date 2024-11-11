import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import { Container } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Snackbar from '@mui/material/Snackbar'
import TimerIcon from '@mui/icons-material/Timer'
import { capitalizeFirstLetterOfString } from '@/utils'
import dayjs from 'dayjs'
import { jwtDecode } from 'jwt-decode'

import useAuthApi from '@/api/useAuthApi'
import { useIdleTimer } from 'react-idle-timer'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSetAlertMessage } from '@/stores/ZustandStores'
import { useTranslation } from 'react-i18next'

const getCountdown = (token) => {
  const decoded = jwtDecode(token)
  const expiration = dayjs(decoded.expires).unix()
  const currentTime = dayjs().unix()
  return expiration - currentTime
}

export default function TimerAlert() {
  const { t } = useTranslation()
  const [token, setToken] = useLocalStorage('user-token', null)
  const countdown = useMemo(() => getCountdown(token), [token])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const promptBeforeIdle = countdown && countdown < 60 ? countdown - 1 : 59
  const [remaining, setRemaining] = useState(countdown || 59)
  const navigate = useNavigate()
  const setAlertMessage = useSetAlertMessage()
  const { extendToken, logout } = useAuthApi()

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000))
    }, 500)

    return () => {
      clearInterval(interval)
    }
  })

  const onActive = async () => {
    await handleExtendToken()
  }

  const onPrompt = () => {
    setIsNotificationOpen(true)
  }

  const onIdle = async () => {
    try {
      await logout()
      setIsNotificationOpen(false)
      setAlertMessage({
        msg: capitalizeFirstLetterOfString(t('srv_login_expired')),
        severity: 'error',
      })
      navigate(`/login`, {
        state: {
          from: '',
        },
        replace: true,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleClose = () => {
    setIsNotificationOpen(false)
  }

  const handleStillHere = () => {
    activate()
  }

  const { getRemainingTime, activate, reset } = useIdleTimer({
    onIdle,
    onActive,
    onPrompt,
    timeout: countdown * 1000,
    promptBeforeIdle: promptBeforeIdle * 1000,
    events: [],
    throttle: 500,
  })

  const timeTillPrompt = Math.max(
    Math.floor(remaining - promptBeforeIdle / 1000),
    0
  )

  const extendMutation = useMutation({
    mutationKey: ['authGuard'],
    mutationFn: () => extendToken(),
    onSuccess: (newToken) => {
      setToken(newToken)
      handleClose()
      reset()
    },
    onError: (error) => {
      console.error('Token extension failed: ', error)
      setToken(null)
    },
    onSettled: () => {
      handleClose()
    },
  })

  const handleExtendToken = async () => {
    await extendMutation.mutateAsync()
  }

  return (
    <Snackbar
      open={isNotificationOpen}
      onClose={handleClose}
      ClickAwayListenerProps={{ onClickAway: () => null }}
    >
      <Alert icon={<TimerIcon fontSize="inherit" />} severity="warning">
        <Container sx={{ display: 'flex', alignItems: 'center' }}>
          {timeTillPrompt > 0 && (
            <>
              {capitalizeFirstLetterOfString(t('misc_auto_logout_in'))}:{' '}
              {timeTillPrompt} s
              <LoadingButton
                variant="contained"
                color="warning"
                onClick={handleStillHere}
                loading={extendMutation.isPending}
                type="button"
                sx={{ ml: 2 }}
              >
                {capitalizeFirstLetterOfString(t('misc_extend'))}
              </LoadingButton>
            </>
          )}
        </Container>
      </Alert>
    </Snackbar>
  )
}
