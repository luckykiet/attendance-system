import { Button, FormHelperText, Grid, InputAdornment, TextField, IconButton } from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { CheckRounded, Visibility, VisibilityOff } from '@mui/icons-material'
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signup } from '@/api/auth';
import { useAuthStoreActions } from '@/stores/auth';
import { useNavigate } from 'react-router-dom';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { zodResolver } from '@hookform/resolvers/zod';
import useTranslation from '@/hooks/useTranslation';
import { fetchAresWithTin } from '@/api/ares';
import FeedbackMessage from '@/components/FeedbackMessage';
import { clearAllQueries, getDefaultAddress } from '@/utils';
import { useConfigStore } from '@/stores/config';
import SignupSchema from '@/schemas/signup';

const SignupForm = () => {
    const { t } = useTranslation();
    const config = useConfigStore();
    const queryClient = useQueryClient();''
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);

    const { login: loginStore } = useAuthStoreActions();

    const [postMsg, setPostMsg] = useState('');
    const navigate = useNavigate();

    const mainUseForm = useForm({
        resolver: zodResolver(SignupSchema),
        defaultValues: {
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            tin: '',
            name: '',
            vin: '',
            address: getDefaultAddress(),
        },
        mode: 'all'
    });

    const { control, handleSubmit, setValue, watch } = mainUseForm;
    const tin = watch('tin');

    const { data: tinData, isLoading: tinLoading, error: tinError, isFetched: tinFetched } = useQuery({
        queryKey: ['ares', tin],
        queryFn: async () => {
            try {
                const recaptcha = await executeRecaptcha(`ares`);
                return fetchAresWithTin({ tin, recaptcha });
            } catch (error) {
                throw new Error(JSON.stringify(error));
            }
        },
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
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            loginStore(data);
            clearAllQueries(queryClient);
            navigate('/');
        }
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword(!showPassword);

    const handleMouseDownPassword = (event) => event.preventDefault();

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptcha = await executeRecaptcha('signup');
            signUpMutation.mutateAsync({ ...data, recaptcha });
        } catch (error) {
            setPostMsg(error.message || 'Unknown error');
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
                            render={({ field, fieldState }) => (
                                <TextField {...field} autoFocus autoComplete='username' variant="outlined" label={t('misc_username')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} autoComplete='email' variant="outlined" label={t('misc_email')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="tin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} variant="outlined" label={t('misc_tin')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                        {tinLoading && <FormHelperText>{t('misc_loading_data')}</FormHelperText>}
                        {tinError && <FormHelperText error>{t('srv_invalid_tin')}</FormHelperText>}
                        {tinFetched && !tinData && <FormHelperText>{t('srv_merchant_not_found')}</FormHelperText>}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} variant="outlined" label={t('misc_name')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="vin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} variant="outlined" label={t('misc_vin')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="address.street"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} variant="outlined" label={t('misc_street')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Controller
                            name="address.city"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} variant="outlined" label={t('misc_city')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Controller
                            name="address.zip"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField {...field} variant="outlined" label={t('misc_postal_code')} fullWidth error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    variant="outlined"
                                    label={t('misc_password')}
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    error={fieldState.invalid}
                                    helperText={fieldState.invalid && t(fieldState.error.message)}
                                    autoComplete='new-password'
                                    slotProps={{
                                        input: {
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
                                        }
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    variant="outlined"
                                    label={t('misc_confirm_password')}
                                    fullWidth
                                    autoComplete="new-password"
                                    slotProps={
                                        {
                                            input: {
                                                endAdornment: field.value && !fieldState.invalid && (
                                                    <InputAdornment position="end">
                                                        <CheckRounded color="success" />
                                                    </InputAdornment>
                                                ),
                                            }
                                        }
                                    }
                                    type="password"
                                    error={fieldState.invalid}
                                    helperText={fieldState.invalid && t(fieldState.error.message)}
                                />
                            )}
                        />
                    </Grid>
                    {postMsg && (
                        <Grid size={{ xs: 12 }}>
                            <FeedbackMessage message={postMsg} />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12 }}>
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
                    </Grid>
                </Grid>
            </form>
        </FormProvider>
    );
};

export default SignupForm;
