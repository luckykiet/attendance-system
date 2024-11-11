import {
  Box,
  Container,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CONFIG } from '@/configs'
import { Controller, useForm } from 'react-hook-form'
import { Fragment, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { LoadingButton } from '@mui/lab'
import LoadingCircle from '@/components/LoadingCircle'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import _ from 'lodash'
import { capitalizeFirstLetterOfString } from '@/utils'
import useAuthApi from '@/api/useAuthApi'
import { useTranslation } from 'react-i18next'

export default function RenewPasswordPage() {
  const { token } = useParams()
  const [postMsg, setPostMsg] = useState({})
  const [passwordChanged, setPasswordChanged] = useState(false)
  const { t } = useTranslation()
  const { changeForgottenPassword, checkChangePasswordToken } = useAuthApi()
  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'all',
  })

  const { isLoading, isFetching, data } = useQuery({
    queryKey: [
      'password_change_token',
      {
        token: token,
      },
    ],
    queryFn: () => checkChangePasswordToken(token),
    enabled: !_.isEmpty(token),
    retry: false,
  })

  useEffect(() => {
    document.title = `${t('misc_renew_password')} | ${CONFIG.APP_NAME}`
  }, [t])

  const changeForgottenPasswordMutation = useMutation({
    mutationFn: ({ password, confirmPassword, token }) =>
      changeForgottenPassword({ password, confirmPassword, token }),
    onError: (error) => {
      console.log(error)
      setPostMsg(error)
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
      changeForgottenPasswordMutation.mutateAsync({ ...data, token })
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
        ) : !data || _.isEmpty(token) ? (
          <Typography
            variant="body1"
            color={'error'}
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
                  to={'/login'}
                >
                  {t('misc_to_login')}
                </Link>
              </Typography>
            ) : (
              <form onSubmit={handleSubmit(handleSubmitPasswordChange)}>
                <Stack spacing={2}>
                  <Controller
                    name="password"
                    rules={{
                      required: capitalizeFirstLetterOfString(
                        t('misc_required')
                      ),
                      minLength: {
                        value: 8,
                        message: capitalizeFirstLetterOfString(
                          t('srv_password_requirements')
                        ),
                      },
                      pattern: {
                        value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/,
                        message: capitalizeFirstLetterOfString(
                          t('srv_password_requirements')
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
                        label={t('misc_password')}
                        type="password"
                        placeholder="*************"
                        required
                        autoComplete="off"
                        error={
                          fieldState.invalid ||
                          (postMsg instanceof Object &&
                            postMsg['password'] !== undefined)
                        }
                        helperText={
                          (fieldState.invalid && fieldState.error.message) ||
                          (postMsg instanceof Object && postMsg['password'])
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockRoundedIcon />
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

                  <Controller
                    name="confirmPassword"
                    rules={{
                      required: capitalizeFirstLetterOfString(
                        t('misc_required')
                      ),
                      minLength: {
                        value: 8,
                        message: capitalizeFirstLetterOfString(
                          t('srv_password_requirements')
                        ),
                      },
                      pattern: {
                        value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/,
                        message: capitalizeFirstLetterOfString(
                          t('srv_password_requirements')
                        ),
                      },

                      validate: (val) => {
                        if (watch('password') !== val) {
                          return 'srv_passwords_not_match'
                        }
                        return !!val.trim()
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
                        label={t('misc_confirm_password')}
                        type="password"
                        placeholder="*************"
                        autoComplete="off"
                        required
                        error={
                          fieldState.invalid ||
                          (postMsg instanceof Object &&
                            postMsg['confirmPassword'] !== undefined)
                        }
                        helperText={
                          fieldState.invalid &&
                          capitalizeFirstLetterOfString(
                            t('srv_passwords_not_match')
                          )
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockRoundedIcon />
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
                    loading={changeForgottenPasswordMutation.isPending}
                  >
                    {t('misc_to_recover_password')}
                  </LoadingButton>
                </Stack>
              </form>
            )}
            {postMsg && (
              <Typography
                variant="body2"
                textAlign={'center'}
                color={postMsg instanceof Error ? 'error' : 'success.main'}
                sx={{ mt: 2 }}
              >
                {postMsg instanceof Error
                  ? capitalizeFirstLetterOfString(t(postMsg.message))
                  : typeof postMsg === 'string' &&
                  capitalizeFirstLetterOfString(t(postMsg))}
              </Typography>
            )}
          </Fragment>
        )}
      </Box>
    </Container>
  )
}
