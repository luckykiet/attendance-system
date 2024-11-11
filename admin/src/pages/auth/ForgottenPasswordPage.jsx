import {
  Box,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'

import { CONFIG } from '@/configs'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import { LoadingButton } from '@mui/lab'
import _ from 'lodash'
import { capitalizeFirstLetterOfString } from '@/utils'
import useAuthApi from '@/api/useAuthApi'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

export default function ForgottenPasswordPage() {
  const [postMsg, setPostMsg] = useState('')
  const { t } = useTranslation()
  const { sendForgottenPassword } = useAuthApi()

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'all',
  })

  useEffect(() => {
    document.title = `${t('misc_forgotten_password')} | ${CONFIG.APP_NAME}`
  }, [t])

  const sendForgottenPasswordMutation = useMutation({
    mutationFn: (email) => sendForgottenPassword(email),
    onError: (error) => {
      console.log(error)
      setPostMsg({
        success: false,
        msg: error.response?.data.msg ? error.response.data.msg : error,
      })
    },
    onSuccess: () => {
      setPostMsg({
        success: true,
        msg: `${t('msg_request_sent')}! ${t('msg_to_check_email')}.`,
      })
    },
  })

  const onSubmit = async (data) => {
    setPostMsg('')
    if (!isValid) {
      setPostMsg(new Error(t('msg_control_typed_field')))
    } else {
      sendForgottenPasswordMutation.mutateAsync(data?.email)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
      <Typography variant="h5" gutterBottom align="center">
        {t('misc_forgotten_password')}
      </Typography>
      <Box sx={{ mt: 3 }}>
        {postMsg?.success ? (
          <Typography
            variant="body1"
            gutterBottom
            color={'success.main'}
            align="center"
          >
            {t(postMsg.msg)}
          </Typography>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <Controller
                name="email"
                rules={{
                  required: capitalizeFirstLetterOfString(t('misc_required')),
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: capitalizeFirstLetterOfString(
                      t('srv_wrong_email_format')
                    ),
                  },
                  validate: (value) => {
                    return !!value.trim()
                  },
                }}
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <TextField
                    {...field}
                    inputRef={ref}
                    fullWidth
                    variant="outlined"
                    onBlur={handleSubmit}
                    label={'Email'}
                    type="email"
                    placeholder="abc@def.com"
                    required
                    error={
                      fieldState.invalid ||
                      (postMsg instanceof Object &&
                        postMsg['email'] !== undefined)
                    }
                    helperText={
                      (fieldState.invalid && fieldState.error.message) ||
                      (postMsg instanceof Object && postMsg['email'])
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon />
                        </InputAdornment>
                      ),
                      endAdornment: !_.isEmpty(field.value) &&
                        !fieldState.invalid && (
                          <InputAdornment position="end">
                            <CheckRoundedIcon color="success" />
                          </InputAdornment>
                        ),
                    }}
                  />
                )}
              />

              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                loading={sendForgottenPasswordMutation.isPending}
              >
                {t('misc_to_recover_password')}
              </LoadingButton>
            </Stack>
          </form>
        )}

        {postMsg && (
          <Typography
            variant="body2"
            color={postMsg instanceof Error ? 'error' : 'success.main'}
            sx={{ mt: 2 }}
          >
            {postMsg instanceof Error
              ? capitalizeFirstLetterOfString(t(postMsg.message))
              : typeof postMsg === 'string' &&
                capitalizeFirstLetterOfString(t(postMsg))}
          </Typography>
        )}
      </Box>
    </Container>
  )
}
