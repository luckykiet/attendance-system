import { Button, Link, Grid2, InputAdornment, Stack, Typography, TextField } from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Password, Person, Visibility, VisibilityOff } from '@mui/icons-material'
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import IconButton from '@mui/material/IconButton';
import { useAuthStoreActions } from '@/stores/auth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CONFIG } from '@/configs';
import { useTranslation } from 'react-i18next';
import { login } from '@/api/auth';
import FeedbackMessage from '@/components/FeedbackMessage';

const LoginForm = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);

    const { login: loginStore } = useAuthStoreActions();
    const [postMsg, setPostMsg] = useState('');
    const navigate = useNavigate();

    const loginSchema = z.object({
        username: z
            .string({ required_error: t('misc_required') })
            .regex(/^\S+$/, t('srv_invalid_username', { capitalize: true }))
            .max(255),
        password: z.string({ required_error: t('misc_required') }).max(255)
    });

    const mainUseForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: import.meta.env.MODE === 'development' ? 'demo' : '',
            password: import.meta.env.MODE === 'development' ? 'G123456g' : ''
        },
        mode: 'all'
    });

    const { control, handleSubmit } = mainUseForm;

    const loginMutation = useMutation({
        mutationFn: (data) => login(data),
        onError: (error) => {
            setPostMsg(new Error(error))
        },
        onSuccess: (data) => {
            loginStore(data);
            queryClient.clear();
            navigate('/');
        }
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const onSubmit = async (data) => {
        try {
            const recaptchaToken = await executeRecaptcha('login');
            if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
                throw new Error(t('err_invalid_recaptcha'));
            }
            loginMutation.mutateAsync({ ...data, recaptcha: recaptchaToken || '' });
        } catch (error) {
            console.error('Login failed:', error);
            setPostMsg(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return (
        <FormProvider {...mainUseForm}>
            <form noValidate onSubmit={handleSubmit(onSubmit)}>
                <Grid2 container spacing={3}>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    label="Username"
                                    placeholder="Username"
                                    variant="outlined"
                                    onBlur={handleSubmit}
                                    error={Boolean(fieldState.isTouched && fieldState.invalid)}
                                    helperText={fieldState.invalid && fieldState.error.message}
                                    required
                                    autoComplete="off"
                                    slotProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    label={t('misc_password')}
                                    placeholder={t('misc_password')}
                                    variant="outlined"
                                    onBlur={handleSubmit}
                                    error={Boolean(fieldState.isTouched && fieldState.invalid)}
                                    helperText={fieldState.isTouched && fieldState.invalid && fieldState.error.message}
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="off"
                                    slotProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Password />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }} sx={{ mt: -1 }}>
                        <Stack spacing={1}>
                            <Typography variant="body1" gutterBottom sx={{ py: 2 }}>
                                {t('msg_do_not_have_account')}
                                {'? '}
                                <Link
                                    component={RouterLink}
                                    variant="body1"
                                    to={'/signup'}
                                >
                                    {t('misc_to_register')}
                                </Link>
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {t('msg_have_forgotten_password')}
                                {'? '}
                                <Link
                                    component={RouterLink}
                                    variant="body1"
                                    to={'/forgot-password'}
                                >
                                    {t('misc_to_recover_password')}
                                </Link>
                            </Typography>
                        </Stack>
                    </Grid2>
                    {postMsg && (
                        <Grid2 size={{ xs: 12 }}>
                            <FeedbackMessage message={postMsg} />
                        </Grid2>
                    )}
                    <Grid2 size={{ xs: 12 }}>
                        <Button
                            disableElevation
                            disabled={loginMutation.isPending}
                            fullWidth
                            size="large"
                            type="submit"
                            variant="contained"
                            color="primary"
                        >
                            {t('misc_login', { capitalize: true })}
                        </Button>
                    </Grid2>
                </Grid2>
            </form>
        </FormProvider>
    );
};

export default LoginForm;
