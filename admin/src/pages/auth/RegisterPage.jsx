import {
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { capitalizeFirstLetterOfString, errorFormHandler } from '@/utils'
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CONFIG } from '@/configs'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import { LoadingButton } from '@mui/lab'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import _ from 'lodash'
import useAuthApi from '@/api/useAuthApi'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import useRecaptchaV3 from '@/hooks/useRecaptchaV3'
import { useTranslation } from 'react-i18next'

export default function RegisterPage() {
  const [postMsg, setPostMsg] = useState('')
  const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY)
  // eslint-disable-next-line no-unused-vars
  const [token, setToken] = useLocalStorage('user-token', null)

  const {
    control,
    handleSubmit,
    watch,
    setFocus,
    setError,
    // eslint-disable-next-line no-unused-vars
    formState: { errors, isValid, dirtyFields },
  } = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'all',
  })

  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register } = useAuthApi()
  const queryClient = useQueryClient()

  useEffect(() => {
    document.title = `${t('misc_registration')} | ${CONFIG.APP_NAME}`
  }, [t])

  const registerMutation = useMutation({
    mutationFn: ({ data, recaptcha }) => register(data, recaptcha),
    onError: (error) => {
      console.log(error)
      const err = errorFormHandler(error.msg ? error.msg : error, t, setError)
      setPostMsg(err)
    },
    onSuccess: (newToken) => {
      queryClient.clear()
      setToken(newToken)
      navigate('/')
    },
  })

  const onSubmit = async (data) => {
    setPostMsg('')
    if (!_.isEmpty(errors)) {
      const formErrors = Object.keys(errors)
      const firstError = formErrors.find((field) => errors[field])
      if (firstError) {
        setFocus(firstError)
      }
      setPostMsg(new Error(t('msg_control_typed_field')))
    } else {
      const recaptchaToken = await executeRecaptcha('registration')
      registerMutation.mutateAsync({ data, recaptcha: recaptchaToken })
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" gutterBottom align="center">
          {t('msg_registration_form')}
        </Typography>
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

            <Controller
              name="username"
              rules={{
                required: capitalizeFirstLetterOfString(t('misc_required')),
                pattern: {
                  value: /^(?!.*__)[a-z0-9_]+$/,
                  message: capitalizeFirstLetterOfString(
                    t('srv_username_requirements')
                  ),
                },
                minLength: {
                  value: 6,
                  message: capitalizeFirstLetterOfString(
                    t('srv_username_requirements')
                  ),
                },
                maxLength: {
                  value: 20,
                  message: capitalizeFirstLetterOfString(
                    t('srv_username_requirements')
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
                  label={'Username'}
                  type="text"
                  placeholder="username"
                  required
                  error={
                    fieldState.invalid ||
                    (postMsg instanceof Object &&
                      postMsg['username'] !== undefined)
                  }
                  helperText={
                    (fieldState.invalid && fieldState.error.message) ||
                    (postMsg instanceof Object && postMsg['username'])
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon />
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
              name="password"
              rules={{
                required: capitalizeFirstLetterOfString(t('misc_required')),
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
                  autoComplete="off"
                  required
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
                required: capitalizeFirstLetterOfString(t('misc_required')),
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
                    capitalizeFirstLetterOfString(t('srv_passwords_not_match'))
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

            <FormControl required error={postMsg !== ''}>
              <FormControlLabel
                control={
                  <Checkbox required id="agreementCheckBox" color="primary" />
                }
                label={t('msg_accept_agreements')}
              />
            </FormControl>
            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              loading={registerMutation.isPending}
            >
              {t('misc_to_register')}
            </LoadingButton>
          </Stack>
        </form>
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
      </Stack>
    </Container>
  )
}
