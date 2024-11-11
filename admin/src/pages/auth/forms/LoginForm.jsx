import { Button, Link, FormHelperText, Grid, InputAdornment, InputLabel, OutlinedInput, Stack } from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import IconButton from '@mui/material/IconButton';
import useAuthApi from '@/api/useAuthApi';
import { useAuthStoreActions } from '@/stores/auth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import useTranslation from '@/hooks/useTranslation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CONFIG } from '@/configs';

const LoginForm = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);

    const { login: loginStore } = useAuthStoreActions();
    const { login } = useAuthApi();
    const [postMsg, setPostMsg] = useState('');
    const navigate = useNavigate();

    const loginSchema = z.object({
        username: z
            .string({ required_error: t('misc_required') })
            .regex(/^\S+$/, t('err_invalid_username', { capitalize: true }))
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
            console.log(error);
            setPostMsg(error);
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
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_username', { capitalize: true })}</InputLabel>
                                    <OutlinedInput {...field} placeholder="abcdef" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_password', { capitalize: true })}</InputLabel>
                                    <OutlinedInput
                                        {...field}
                                        fullWidth
                                        error={Boolean(fieldState.isTouched && fieldState.invalid)}
                                        type={showPassword ? 'text' : 'password'}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                    color="secondary"
                                                >
                                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                        placeholder="**************"
                                    />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sx={{ mt: -1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                            <Link variant="h6" component={RouterLink} to={'/forgot-password'} color="text.primary">
                                {t('misc_forgotten_password', { capitalize: true })}?
                            </Link>
                        </Stack>
                    </Grid>
                    {postMsg && (
                        <Grid item xs={12}>
                            <FormHelperText error>
                                {postMsg instanceof Error ? t(postMsg.message, { capitalize: true }) : t(postMsg, { capitalize: true })}
                            </FormHelperText>
                        </Grid>
                    )}

                    <Grid item xs={12}>
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
                    </Grid>
                </Grid>
            </form>
        </FormProvider>
    );
};

export default LoginForm;
