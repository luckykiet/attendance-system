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

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { LoadingButton } from '@mui/lab';
import { useMutation } from '@tanstack/react-query';
import useTranslation from '@/hooks/useTranslation';
import { forgotPassword } from '@/api/auth';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FeedbackMessage from '@/components/FeedbackMessage';
import { useConfigStore } from '@/stores/config';
import { defaultAppName } from '@/configs';

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'misc_required' })
    .email('srv_wrong_email_format'),
});

export default function ForgottenPasswordPage() {
  const [postMsg, setPostMsg] = useState('');
  const config = useConfigStore();
  const { t } = useTranslation();

  const title = `${t('misc_forgotten_password')} | ${config.appName || defaultAppName}`;

  useEffect(() => {
    document.title = title;
  }, [title]);

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
      setPostMsg(`${t('msg_request_sent')}! ${t('msg_to_check_email')}. ${t('msg_if_account_exists')}.`);
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
                  disabled={sendForgottenPasswordMutation.isSuccess}
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
