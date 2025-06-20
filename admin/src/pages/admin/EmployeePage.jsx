import { Container, Typography, TextField, Grid, Stack, FormControlLabel, Switch, Divider, ButtonGroup, Button, InputLabel } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';
import useTranslation from '@/hooks/useTranslation';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import LoadingCircle from '@/components/LoadingCircle';
import { fetchEmployee, createEmployee, updateEmployee, deleteEmployee, createEmployeeDeviceRegistration, cancelPairingDevice } from '@/api/employee';
import { checkPrivileges, getDefaultEmployee } from '@/utils';
import { useEffect, useState } from 'react';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { hostname, protocol } from '@/configs';
import FeedbackMessage from '@/components/FeedbackMessage';
import _ from 'lodash';
import { useSetAlertMessage } from '@/stores/root';
import { useAuthStore } from '@/stores/auth';
import { useSetConfirmBox } from '@/stores/confirm';
import { QRCodeCanvas } from 'qrcode.react';
import TransferListEmployees from '@/components/admin/TransferListEmployees';
import { useConfigStore } from '@/stores/config';
import EmployeeSchema from '@/schemas/employee';
import PhoneInput from '@/components/PhoneInput';

dayjs.extend(customParseFormat);

export default function EmployeePage() {
    const { employeeId } = useParams();
    const config = useConfigStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);
    const [postMsg, setPostMsg] = useState('');
    const setAlertMessage = useSetAlertMessage();
    const setConfirmBox = useSetConfirmBox();

    const employeeQuery = useQuery({
        queryKey: ['employee', { employeeId }],
        queryFn: () => fetchEmployee(employeeId),
        enabled: !!employeeId,
    });

    const { data: employee, isLoading: isEmployeeLoading } = employeeQuery;

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(EmployeeSchema),
        defaultValues: getDefaultEmployee(),
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = mainForm;

    const createEmployeeMutation = useMutation({
        mutationFn: (data) => createEmployee(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['employees']);
            navigate(`/employee/${data._id}`, { replace: true });
        },
    });

    const updateEmployeeMutation = useMutation({
        mutationFn: (data) => updateEmployee(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['employee', { employeeId }]);
            queryClient.invalidateQueries(['employees']);
            setPostMsg(data);
        },
    });

    const deleteEmployeeMutation = useMutation({
        mutationFn: () => deleteEmployee(employeeId),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: data, severity: 'success' });
            queryClient.invalidateQueries(['employees']);
            navigate('/employees');
        }
    })

    const cancelPairingEmployeeMutation = useMutation({
        mutationFn: () => cancelPairingDevice(employeeId),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: data, severity: 'success' });
            queryClient.invalidateQueries(['employee', { employeeId }]);
            queryClient.invalidateQueries(['employees']);
        }
    })

    const generateEmployeeTokenMutation = useMutation({
        mutationFn: (form) => createEmployeeDeviceRegistration(form),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setValue('registrationToken', data);
        },
    });

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptcha = await executeRecaptcha(`${employeeId ? 'update' : 'create'}employee`);
            if (employeeId) {
                updateEmployeeMutation.mutate({ ...data, _id: employeeId, recaptcha });
            } else {
                createEmployeeMutation.mutate({ ...data, recaptcha });
            }
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }

    };

    const handleDelete = () => {
        setConfirmBox({
            mainText: `${t('misc_delete')} ${employee.name}?`,
            onConfirm: () => {
                deleteEmployeeMutation.mutate();
            },
        })
    }

    const handleCancelPairing = () => {
        setConfirmBox({
            mainText: `${t('misc_cancel_device_pairing')} ${employee.name}?`,
            onConfirm: () => {
                cancelPairingEmployeeMutation.mutate();
            },
        })
    }

    const handleGenerateToken = async (isSend = false) => {
        try {
            setPostMsg('');
            const recaptcha = await executeRecaptcha(`deviceregistration`);
            if (watch('deviceId')) {
                setConfirmBox({
                    mainText: `${t('misc_this_will_unpair_current_device')}. ${t('misc_want_to_continue')}?`,
                    onConfirm: () => {
                        generateEmployeeTokenMutation.mutate({
                            employeeId,
                            isSend,
                            recaptcha,
                        });
                    },
                })
            } else {
                generateEmployeeTokenMutation.mutate({
                    employeeId,
                    isSend,
                    recaptcha,
                });
            }
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    }

    useEffect(() => {
        if (employee) {
            reset(employee);
        }
    }, [employee, reset]);

    if (isEmployeeLoading) {
        return (
            <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
                <LoadingCircle />
            </Container>
        );
    }

    const isProvidingUpdate = createEmployeeMutation.isPending || updateEmployeeMutation.isPending || deleteEmployeeMutation.isPending || cancelPairingEmployeeMutation.isPending || !_.isEmpty(errors)

    return (
        <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
            <Stack spacing={3}>
                <Typography variant="h5">
                    {employeeId ? employee ? employee.name : t('srv_employee_not_found') : t('misc_new_employee')}
                </Typography>
                {(employee || !employeeId) && (
                    <FormProvider {...mainForm}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_full_name')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.error?.message && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_email')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.error?.message && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Stack spacing={1}>
                                                <InputLabel>
                                                    {t('misc_telephone')}
                                                </InputLabel>
                                                <PhoneInput
                                                    initValue={field.value || ''}
                                                    onChange={(val) => field.onChange(val)}
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.error?.message && t(fieldState.error.message)}
                                                />
                                            </Stack>
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="isAvailable"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel
                                                control={<Switch {...field} checked={field.value} />}
                                                label={t('misc_available')}
                                            />
                                        )}
                                    />
                                </Grid>
                                {employee && <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="registrationToken"
                                        control={control}
                                        render={({ field }) => {
                                            const domain = `${config.proxyUrl ? config.proxyUrl : `${protocol}${hostname}`}`;
                                            const qrValue = config.mobileIntent && field.value ? `${config.mobileIntent}registration?tokenId=${field.value}&domain=${encodeURIComponent(domain)}` : '';
                                            return qrValue ? (
                                                <Stack sx={{ display: 'flex', justifyContent: 'center' }} spacing={2}>
                                                    <Stack spacing={1} direction={'row'}>
                                                        <Typography variant="subtitle1">{t('misc_registration_token')}</Typography>
                                                        {!watch('deviceId') && <>
                                                            <Typography variant="subtitle1">-</Typography>
                                                            <Typography variant="subtitle1" color='error'>{t('misc_unpaired')}</Typography>
                                                        </>}
                                                    </Stack>
                                                    <Grid container spacing={2} >
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                            <QRCodeCanvas value={qrValue} size={150} />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                            <Stack spacing={1}>
                                                                <Typography variant="subtitle1">{t('misc_domain')}: {domain}</Typography>
                                                                <Typography variant="subtitle1">Token ID: {field.value}</Typography>
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                </Stack>
                                            ) : (
                                                watch('deviceId') ? <Typography variant="subtitle1" color='success'>{t('misc_device_paired')}</Typography> : <Typography color='error' variant="subtitle1">{t('misc_unpaired')}</Typography>
                                            )
                                        }
                                        }
                                    />
                                </Grid>}
                                {employee && <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="deviceId"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_device_id')}
                                                variant="outlined"
                                                disabled
                                            />
                                        )}
                                    />
                                </Grid>}
                            </Grid>
                            <Grid container spacing={2} sx={{ mt: 3 }}>
                                <Grid size={{ xs: 12 }}>
                                    {postMsg && <FeedbackMessage message={postMsg} />}
                                </Grid>
                                {!_.isEmpty(employee) && <Grid size={{ xs: 12 }}>
                                    <ButtonGroup fullWidth>
                                        <Button sx={{ minWidth: '200px' }} variant="contained" color="primary" onClick={() => navigate(`/employee/dashboard/${employeeId}`)} >
                                            {t('misc_dashboard')}
                                        </Button>
                                    </ButtonGroup>
                                </Grid>}
                                {!_.isEmpty(employee) && <Grid size={{ xs: 12 }}>
                                    <ButtonGroup fullWidth>
                                        {employee &&
                                            <Button sx={{ minWidth: '200px' }} variant="contained" color="warning" onClick={() => handleGenerateToken()} loading={generateEmployeeTokenMutation.isPending} disabled={isProvidingUpdate}>
                                                {t(watch('registrationToken') || watch('deviceId') ? 'misc_regenerate_token' : 'misc_generate_token')}
                                            </Button>
                                        }
                                        {employee &&
                                            <Button sx={{ minWidth: '200px' }} variant="contained" color="primary" onClick={() => handleGenerateToken(true)} loading={generateEmployeeTokenMutation.isPending} disabled={isProvidingUpdate}>
                                                {t(watch('registrationToken') || watch('deviceId') ? 'misc_regenerate_token_and_send' : 'misc_generate_token_and_send')}
                                            </Button>
                                        }
                                        {employee && <Button sx={{ minWidth: '200px' }} variant="contained" color="error" onClick={() => handleCancelPairing()} loading={cancelPairingEmployeeMutation.isPending} disabled={isProvidingUpdate}>
                                            {t('misc_cancel_device_pairing')}
                                        </Button>}
                                    </ButtonGroup>
                                </Grid>}
                                <Grid size={{ xs: 12 }}>
                                    <ButtonGroup fullWidth>
                                        <Button sx={{ minWidth: '200px' }} variant="contained" color="success" type="submit" loading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending} disabled={deleteEmployeeMutation.isPending || !_.isEmpty(errors)}>
                                            {employeeId ? t('misc_save') : t('misc_create')}
                                        </Button>
                                        <Button sx={{ minWidth: '200px' }} variant="outlined" color="secondary" onClick={() => navigate('/employees')} disabled={isProvidingUpdate}>
                                            {t('misc_cancel')}
                                        </Button>
                                        {employee && checkPrivileges('deleteEmployee', user?.role) &&
                                            <Button sx={{ minWidth: '200px' }} variant="outlined" color="error" loading={deleteEmployeeMutation.isPending} disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending} onClick={handleDelete}>
                                                {t('misc_delete')}
                                            </Button>}
                                    </ButtonGroup>
                                </Grid>
                            </Grid>
                        </form>
                    </FormProvider>
                )}
                {employee &&
                    <>
                        <Divider />
                        <TransferListEmployees employeeId={employeeId} />
                    </>}
            </Stack>
        </Container>
    );
}
