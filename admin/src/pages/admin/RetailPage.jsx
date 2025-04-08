import { Container, Typography, TextField, Grid, Stack, ButtonGroup } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTranslation from '@/hooks/useTranslation';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import LoadingCircle from '@/components/LoadingCircle';
import { checkPrivileges, getDefaultRetail } from '@/utils';
import { useEffect, useState } from 'react';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import FeedbackMessage from '@/components/FeedbackMessage';
import { LoadingButton } from '@mui/lab';
import _ from 'lodash';
import { useSetAlertMessage, useSetRetail } from '@/stores/root';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { fetchRetail, updateRetail } from '@/api/retail';
import RetailSchema from '@/schemas/retail';
import { fetchAresWithTin } from '@/api/ares';

dayjs.extend(customParseFormat);

export default function RetailPage() {
    const config = useConfigStore();
    const { t } = useTranslation();
    const { user: loggedInUser } = useAuthStore();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);
    const [postMsg, setPostMsg] = useState('');
    const setAlertMessage = useSetAlertMessage();
    const setRetail = useSetRetail();

    const retailQuery = useQuery({
        queryKey: ['retail'],
        queryFn: () => fetchRetail(),
    });

    const { data: retail, isFetching: isRetailFetching, isLoading: isRetailLoading } = retailQuery;

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(RetailSchema),
        defaultValues: getDefaultRetail(),
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, dirtyFields },
    } = mainForm;

    const updateRetailMutation = useMutation({
        mutationFn: (data) => updateRetail(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['retail']);
            setRetail(data);
            setAlertMessage({ msg: t('misc_updated_successfully'), severity: 'success' });
        },
    });

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptcha = await executeRecaptcha(`updateretail`);
            updateRetailMutation.mutate({ ...data, recaptcha });
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    };
    const fetchAresMutation = useMutation({
        mutationFn: (form) => fetchAresWithTin(form),
        onError: (error) => {
            console.log(error)
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setValue('name', data.name, { shouldDirty: true });
            setValue('vin', data.vin, { shouldDirty: true });
            setValue('address', data.address, { shouldDirty: true });
            setAlertMessage({ msg: t('misc_fetched_successfully'), severity: 'success' });
        },
    });

    const handleFetchAres = async (tin) => {
        try {
            const recaptcha = await executeRecaptcha(`ares`);
            fetchAresMutation.mutateAsync({ tin, recaptcha });
        } catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    }

    useEffect(() => {
        if (retail) {
            reset({ ...getDefaultRetail(), ...retail });
        }
    }, [retail, reset]);

    if (isRetailLoading || isRetailFetching) {
        return (
            <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
                <LoadingCircle />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
            {!checkPrivileges('editRetail', loggedInUser?.role) ? <Typography color='error' variant='h6'>{t('srv_no_permission')}</Typography> :
                <Stack spacing={3}>
                    <Typography variant="h5">
                        {t('misc_retail_edit')}
                    </Typography>
                    {<FormProvider {...mainForm}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="tin"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField {...field} variant="outlined" label={t('misc_tin')} fullWidth
                                                    disabled error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="vin"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField {...field} variant="outlined" label={t('misc_vin')} fullWidth
                                                    error={fieldState.invalid} helperText={fieldState.invalid && t(fieldState.error.message)} />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_name')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.error?.message && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="address.street"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_street')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.invalid && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="address.city"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_city')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.invalid && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="address.zip"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_postal_code')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.invalid && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid>

                            </Grid>
                            <Grid container spacing={2} sx={{ mt: 3 }}>
                                <Grid size={{ xs: 12 }}>
                                    {postMsg && <FeedbackMessage message={postMsg} />}
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <ButtonGroup>
                                        <LoadingButton sx={{ minWidth: '200px' }}
                                            variant="contained" color="warning" type="button"
                                            loading={updateRetailMutation.isPending || fetchAresMutation.isPending}
                                            disabled={_.isEmpty(watch('tin'))}
                                            onClick={() => {
                                                handleFetchAres(watch('tin'));
                                            }}
                                        >
                                            {t('misc_fetch_ares')}
                                        </LoadingButton>
                                        <LoadingButton sx={{ minWidth: '200px' }}
                                            variant="contained" color="success" type="submit"
                                            loading={updateRetailMutation.isPending || fetchAresMutation.isPending}
                                            disabled={!_.isEmpty(errors) || _.isEmpty(dirtyFields)}
                                        >
                                            {t('misc_save')}
                                        </LoadingButton>
                                    </ButtonGroup>
                                </Grid>
                            </Grid>
                        </form>
                    </FormProvider>}
                </Stack>
            }
        </Container>
    );
}
