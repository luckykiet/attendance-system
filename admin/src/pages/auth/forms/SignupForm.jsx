import { Button, FormHelperText, Grid2, InputAdornment, InputLabel, OutlinedInput, Stack } from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Eye, EyeSlash } from 'iconsax-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import IconButton from '@mui/material/IconButton';
import useAuthApi from '@/api/useAuthApi';
import { useAuthStoreActions } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import useTranslation from '@/hooks/useTranslation';
import useAresApi from '@/api/useAresApi';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CONFIG } from '@/configs';

const SignupForm = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);

    const { login: loginStore } = useAuthStoreActions();
    const { signup } = useAuthApi();
    const { fetchAresWithTin } = useAresApi();
    const [postMsg, setPostMsg] = useState('');
    const navigate = useNavigate();

    const signupSchema = z.object({
        username: z.string().trim().min(4, { message: 'srv_invalid_username_length' })
            .max(255, { message: 'srv_invalid_username_length' })
            .regex(/^\S+$/, { message: 'srv_invalid_username' }),
        email: z.string().email({ message: 'srv_invalid_email' }),
        tin: z.string().regex(/^[0-9]{8}$/, { message: 'srv_invalid_tin' }),
        name: z.string().max(255, { message: 'srv_invalid_name_length' }),
        vin: z.string().max(255, { message: 'srv_invalid_vin' }).optional(),
        address: z.object({
            street: z.string().max(255, { message: 'srv_invalid_street_length' }).optional(),
            city: z.string().max(255, { message: 'srv_invalid_city_length' }).optional(),
            zip: z.string().max(20, { message: 'srv_invalid_zip_length' }).optional(),
        }),
        password: z.string().min(8, { message: 'srv_invalid_password_length' }).max(255, { message: 'srv_invalid_password_length' }),
        confirmPassword: z.string().max(255, { message: 'srv_invalid_password_length' })
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'srv_passwords_not_match',
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

    const loginMutation = useMutation({
        mutationFn: (data) => signup(data),
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
            const recaptchaToken = await executeRecaptcha('signup');
            if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
                throw new Error(t('err_invalid_recaptcha'));
            }
            loginMutation.mutateAsync({ ...data, recaptcha: recaptchaToken || '' });
        } catch (error) {
            console.error('Signup failed:', error);
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
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_username')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="abcdef" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_email')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="user@example.com" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="tin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_tin')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="12345678" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
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
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_name')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="John Doe" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="vin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_vin')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="VIN" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="address.street"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_street')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="Street" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name="address.city"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_city')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="City" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name="address.zip"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_postal_code')}</InputLabel>
                                    <OutlinedInput {...field} placeholder="ZIP Code" fullWidth error={Boolean(fieldState.isTouched && fieldState.invalid)} />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_password')}</InputLabel>
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
                                                >
                                                    {showPassword ? <Eye /> : <EyeSlash />}
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                        placeholder="**************"
                                    />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Stack spacing={1}>
                                    <InputLabel htmlFor={field.name}>{t('misc_confirm_password')}</InputLabel>
                                    <OutlinedInput
                                        {...field}
                                        fullWidth
                                        error={Boolean(fieldState.isTouched && fieldState.invalid)}
                                        type="password"
                                        placeholder="**************"
                                    />
                                    {fieldState.isTouched && fieldState.invalid && <FormHelperText error>{fieldState.error?.message}</FormHelperText>}
                                </Stack>
                            )}
                        />
                    </Grid2>
                    {postMsg && (
                        <Grid2 size={{ xs: 12 }}>
                            <FormHelperText error>
                                {postMsg instanceof Error ? t(postMsg.message) : t(postMsg)}
                            </FormHelperText>
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