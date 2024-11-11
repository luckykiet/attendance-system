import {
  Box,
  Container,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm, FormProvider } from 'react-hook-form'
import { Fragment, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { LoadingButton } from '@mui/lab'
import LoadingCircle from '@/components/LoadingCircle'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { capitalizeFirstLetterOfString } from '@/utils'
import { resetPassword, checkChangePasswordToken } from '@/api/auth'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '@/configs'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import FeedbackMessage from '@/components/FeedbackMessage'

export default function RenewPasswordPage() {
  const { token } = useParams()
  const [postMsg, setPostMsg] = useState({})
  const [passwordChanged, setPasswordChanged] = useState(false)
  const { t } = useTranslation()

  const passwordSchema = z
    .string()
    .min(8, capitalizeFirstLetterOfString(t('srv_password_requirements')))
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, t('srv_password_requirements'))

  const renewPasswordSchema = z
    .object({
      password: passwordSchema,
      confirmPassword: passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('srv_passwords_not_match'),
      path: ['confirmPassword'],
    })

  const mainUseForm = useForm({
    resolver: zodResolver(renewPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'all',
  })

  const { control, handleSubmit, formState: { isValid } } = mainUseForm

  const { isLoading, isFetching, data } = useQuery({
    queryKey: [
      'password_change_token',
      { token },
    ],
    queryFn: () => checkChangePasswordToken(token),
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    document.title = `${t('misc_renew_password')} | ${CONFIG.APP_NAME}`
  }, [t])

  const resetPasswordMutation = useMutation({
    mutationFn: ({ password, confirmPassword, token }) =>
      resetPassword({ password, confirmPassword, token }),
    onError: (error) => {
      setPostMsg(new Error(error))
    },
    onSuccess: (result) => {
      setPasswordChanged(true)
      setPostMsg(result)
    },
  })

  const handleSubmitPasswordChange = async (data) => {
    setPostMsg('')
    if (!isValid) {
      setPostMsg({
        success: false,
        msg: t('msg_control_typed_field'),
      })
    } else {
      resetPasswordMutation.mutateAsync({ ...data, token })
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
      <Typography variant="h5" gutterBottom align="center">
        {t('misc_renew_password')}
      </Typography>
      <Box sx={{ mt: 3 }}>
        {isLoading || isFetching ? (
          <LoadingCircle />
        ) : !data || !token ? (
          <Typography
            variant="body1"
            color="error"
            gutterBottom
            align="center"
          >
            {t('srv_invalid_token')}.
          </Typography>
        ) : (
          <Fragment>
            {passwordChanged ? (
              <Typography variant="h5" gutterBottom align="center">
                {t('msg_password_change_success')}.{' '}
                <Link
                  variant="h5"
                  component={RouterLink}
                  to="/login"
                >
                  {t('misc_to_login')}
                </Link>
              </Typography>
            ) : (
              <FormProvider {...mainUseForm}>
                <form onSubmit={handleSubmit(handleSubmitPasswordChange)}>
                  <Stack spacing={2}>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          variant="outlined"
                          label={t('misc_password')}
                          type="password"
                          placeholder="*************"
                          required
                          autoComplete="off"
                          error={fieldState.invalid}
                          helperText={fieldState.error?.message}
                          slotProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockRoundedIcon />
                              </InputAdornment>
                            ),
                            endAdornment: field.value && !fieldState.invalid && (
                              <InputAdornment position="end">
                                <CheckRoundedIcon color="success" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />

                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          variant="outlined"
                          label={t('misc_confirm_password')}
                          type="password"
                          placeholder="*************"
                          required
                          autoComplete="off"
                          error={fieldState.invalid}
                          helperText={fieldState.error?.message}
                          slotProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockRoundedIcon />
                              </InputAdornment>
                            ),
                            endAdornment: field.value && !fieldState.invalid && (
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
                      loading={resetPasswordMutation.isPending}
                    >
                      {t('misc_to_recover_password')}
                    </LoadingButton>
                  </Stack>
                </form>
              </FormProvider>
            )}
            {postMsg && <FeedbackMessage message={postMsg} />}
          </Fragment>
        )}
      </Box>
    </Container>
  )
}
