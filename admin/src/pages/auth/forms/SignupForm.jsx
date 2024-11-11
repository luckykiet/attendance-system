import { Button, FormHelperText, Grid2, InputAdornment, TextField, IconButton } from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signup } from '@/api/auth';
import { useAuthStoreActions } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CONFIG } from '@/configs';
import { useTranslation } from 'react-i18next';
import { fetchAresWithTin } from '@/api/ares';
import FeedbackMessage from '@/components/FeedbackMessage';

const SignupForm = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);

    const { login: loginStore } = useAuthStoreActions();

    const [postMsg, setPostMsg] = useState('');
    const navigate = useNavigate();

    const signupSchema = z.object({
        username: z
            .string()
            .trim()
            .min(4, { message: t('srv_username_min_length') })
            .max(255, { message: t('srv_username_max_length') })
            .regex(/^\S+$/, { message: t('srv_username_no_whitespace') }),
        email: z
            .string()
            .email({ message: t('srv_wrong_email_format') }),
        tin: z
            .string()
            .regex(/^[0-9]{8}$/, { message: t('srv_tin_invalid_format') }),
        name: z
            .string()
            .max(255, { message: t('srv_name_max_length') }),
        vin: z
            .string()
            .max(255, { message: t('srv_vin_max_length') })
            .optional(),
        address: z.object({
            street: z
                .string()
                .max(255, { message: t('srv_street_max_length') })
                .optional(),
            city: z
                .string()
                .max(255, { message: t('srv_city_max_length') })
                .optional(),
            zip: z
                .string()
                .regex(/^\d{3} ?\d{2}$/, { message: t('srv_zip_invalid_format') })
                .optional(),
        }),
        password: z
            .string()
            .min(8, { message: t('srv_password_min_length') })
            .max(255, { message: t('srv_password_max_length') }),
        confirmPassword: z
            .string()
            .max(255, { message: t('srv_confirm_password_max_length') })
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('srv_passwords_not_match'),
        path: ['confirmPassword']
    });

    const mainUseForm = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            username: import.meta.env.MODE === 'development' ? 'demo' : '',
            password: import.meta.env.MODE === 'development' ? 'G123456g' : '',
            confirmPassword: import.meta.env.MODE === 'development' ? 'G123456g' : '',
            email: '',
            tin: '',
            name: '',
            vin: '',
            address: {
                street: '',
                city: '',
                zip: ''
            }
        },
        mode: 'all'
    });

    const { control, handleSubmit, setValue, watch } = mainUseForm;
    const tin = watch('tin');

    const { data: tinData, isLoading: tinLoading, error: tinError, isFetched: tinFetched } = useQuery({
        queryKey: ['ares', tin],
        queryFn: () => fetchAresWithTin(tin),
        enabled: !!tin && /^[0-9]{8}$/.test(tin),
    });

    useEffect(() => {
        if (tinData) {
            setValue('name', tinData.name);
            setValue('vin', tinData.vin);
            setValue('address', tinData.address);
        }
    }, [setValue, tinData]);

    const signUpMutation = useMutation({
        mutationFn: (data) => signup(data),
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

    const handleClickShowPassword = () => setShowPassword(!showPassword);

    const handleMouseDownPassword = (event) => event.preventDefault();

    const onSubmit = async (data) => {
        try {
            const recaptchaToken = await executeRecaptcha('signup');
            if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
                throw new Error(t('err_invalid_recaptcha'));
            }
            signUpMutation.mutateAsync({ ...data, recaptcha: recaptchaToken || '' });
        } catch (error) {
            setPostMsg(error.message || 'Unknown error');
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
                                <TextField {...field} label={t('misc_username')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_email')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="tin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_tin')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                        {tinLoading && <FormHelperText>{t('loading_tin')}</FormHelperText>}
                        {tinError && <FormHelperText error>{t('err_invalid_tin_data')}</FormHelperText>}
                        {tinFetched && !tinData && <FormHelperText>{t('err_merchant_not_found')}</FormHelperText>}
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_name')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="vin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_vin')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="address.street"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_street')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name="address.city"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_city')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name="address.zip"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label={t('misc_postal_code')} fullWidth error={fieldState.invalid} helperText={fieldState.error?.message} />
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
                                    label={t('misc_password')}
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    error={fieldState.invalid}
                                    helperText={fieldState.error?.message}
                                    slotProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label={t('misc_confirm_password')}
                                    fullWidth
                                    type="password"
                                    error={fieldState.invalid}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                    </Grid2>
                    {postMsg && (
                        <Grid2 size={{ xs: 12 }}>
                            <FeedbackMessage message={postMsg} />
                        </Grid2>
                    )}
                    <Grid2 size={{ xs: 12 }}>
                        <Button
                            disableElevation
                            disabled={signUpMutation.isPending}
                            fullWidth
                            size="large"
                            type="submit"
                            variant="contained"
                        >
                            {t('misc_registration')}
                        </Button>
                    </Grid2>
                </Grid2>
            </form>
        </FormProvider>
    );
};

export default SignupForm;
