import {
  Box,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, FormProvider } from 'react-hook-form';
import { useEffect, useState } from 'react';

import { CONFIG } from '@/configs';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { LoadingButton } from '@mui/lab';
import { capitalizeFirstLetterOfString } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import useTranslation from '@/hooks/useTranslation';
import { forgotPassword } from '@/api/auth';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FeedbackMessage from '@/components/FeedbackMessage';

export default function ForgottenPasswordPage() {
  const [postMsg, setPostMsg] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('misc_forgotten_password')} | ${CONFIG.APP_NAME}`;
  }, [t]);
  const forgotPasswordSchema = z.object({
    email: z
      .string({ required_error: capitalizeFirstLetterOfString(t('misc_required')) })
      .email(capitalizeFirstLetterOfString(t('srv_wrong_email_format')))
  });

  const mainUseForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'all',
  });

  const { control, handleSubmit, formState: { isValid } } = mainUseForm;

  const sendForgottenPasswordMutation = useMutation({
    mutationFn: (email) => forgotPassword(email),
    onError: (error) => {
      setPostMsg(new Error(error));
    },
    onSuccess: () => {
      setPostMsg(`${t('msg_request_sent')}! ${t('msg_to_check_email')}.`);
    },
  });

  const onSubmit = async (data) => {
    setPostMsg('');
    if (!isValid) {
      setPostMsg(new Error(t('msg_control_typed_field')));
    } else {
      sendForgottenPasswordMutation.mutateAsync(data.email);
    }
  };

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
            color="success.main"
            align="center"
          >
            {t(postMsg.msg)}
          </Typography>
        ) : (
          <FormProvider {...mainUseForm}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      label="Email"
                      type="email"
                      placeholder="abc@def.com"
                      required
                      error={fieldState.invalid}
                      helperText={fieldState.invalid && t(fieldState.error.message)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailRoundedIcon />
                            </InputAdornment>
                          ),
                          endAdornment: field.value && !fieldState.error && (
                            <InputAdornment position="end">
                              <CheckRoundedIcon color="success" />
                            </InputAdornment>
                          ),
                        }
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
          </FormProvider>
        )}
        {postMsg && <FeedbackMessage message={postMsg} />}
      </Box>
    </Container>
  );
}
