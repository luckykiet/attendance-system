import { Link, Grid, InputAdornment, Stack, Typography, TextField, Button } from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Password, Person, Visibility, VisibilityOff } from '@mui/icons-material'
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import IconButton from '@mui/material/IconButton';
import { useAuthStoreActions } from '@/stores/auth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { zodResolver } from '@hookform/resolvers/zod';
import useTranslation from '@/hooks/useTranslation';
import { login } from '@/api/auth';
import FeedbackMessage from '@/components/FeedbackMessage';
import { useConfigStore } from '@/stores/config';
import { clearAllQueries } from '@/utils';
import LoginSchema from '@/schemas/login';


const LoginForm = () => {
    const { t } = useTranslation();
    const config = useConfigStore();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);

    const { login: loginStore } = useAuthStoreActions();
    const [postMsg, setPostMsg] = useState('');
    const navigate = useNavigate();

    const mainUseForm = useForm({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            username: import.meta.env.MODE === 'development' ? 'demo' : '',
            password: import.meta.env.MODE === 'development' ? 'demodemo' : ''
        },
        mode: 'all'
    });

    const { control, handleSubmit } = mainUseForm;

    const loginMutation = useMutation({
        mutationFn: (data) => login(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            loginStore(data);
            clearAllQueries(queryClient);
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
            setPostMsg('');
            const recaptcha = await executeRecaptcha('login');
            loginMutation.mutateAsync({ ...data, recaptcha });
        } catch (error) {
            console.error('Login failed:', error);
            setPostMsg(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return (
        <FormProvider {...mainUseForm}>
            <form noValidate onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field, fieldState }) => {
                                return <TextField
                                    {...field}
                                    fullWidth
                                    label={t('misc_username')}
                                    placeholder="Username"
                                    variant="outlined"
                                    onBlur={handleSubmit}
                                    error={fieldState.invalid}
                                    helperText={fieldState.invalid && t(fieldState.error.message)}
                                    required
                                    autoComplete='username'
                                    autoFocus
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
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
                                    error={fieldState.invalid}
                                    helperText={fieldState.invalid && t(fieldState.error.message)}
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete='password'
                                    slotProps={{
                                        input: {
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
                                        }
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ mt: -1 }}>
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
                    </Grid>
                    {postMsg && (
                        <Grid size={{ xs: 12 }}>
                            <FeedbackMessage message={postMsg} />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12 }}>
                        <Button
                            disableElevation
                            loading={loginMutation.isPending}
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
