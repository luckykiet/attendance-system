import { Container, Typography, TextField, Grid2, Stack, FormControlLabel, Switch, Divider } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';
import useTranslation from '@/hooks/useTranslation';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import LoadingCircle from '@/components/LoadingCircle';
import { fetchEmployee, createEmployee, updateEmployee, deleteEmployee } from '@/api/employee';
import { checkPrivileges, getDefaultEmployee, REGEX } from '@/utils';
import { useEffect, useState } from 'react';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { CONFIG } from '@/configs';
import FeedbackMessage from '@/components/FeedbackMessage';
import { LoadingButton } from '@mui/lab';
import _ from 'lodash';
import { useSetAlertMessage } from '@/stores/root';
import { useAuthStore } from '@/stores/auth';
import { useSetConfirmBox } from '@/stores/confirm';

import TransferListEmployees from '@/components/admin/TransferListEmployees';

dayjs.extend(customParseFormat);

const employeeSchema = z.object({
    name: z.string().min(1, { message: 'misc_required' }).max(255),
    email: z.string().email({ message: 'srv_invalid_email' }),
    phone: z.string().optional().refine((val) => !val || REGEX.phone.test(val), { message: 'srv_invalid_phone' }),
    isAvailable: z.boolean(),
});

export default function EmployeePage() {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);
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
        resolver: zodResolver(employeeSchema),
        defaultValues: getDefaultEmployee(),
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = mainForm;

    const createEmployeeMutation = useMutation({
        mutationFn: (data) => createEmployee(data),
        onError: (error) => {
            setPostMsg(new Error(error))
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['employees']);
            navigate(`/employee/${data._id}`, { replace: true });
        },
    });

    const updateEmployeeMutation = useMutation({
        mutationFn: (data) => updateEmployee(data),
        onError: (error) => {
            setPostMsg(new Error(error))
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
            setPostMsg(new Error(error))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: data, severity: 'success' });
            queryClient.invalidateQueries(['employees']);
            navigate('/employees');
        }
    })

    const onSubmit = async (data) => {
        try {
            console.log(data)
            const recaptchaToken = await executeRecaptcha(`${employeeId ? 'update' : 'create'}employee`);

            if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
                throw new Error(t('srv_invalid_recaptcha'));
            }

            if (employeeId) {
                updateEmployeeMutation.mutate({ ...data, _id: employeeId, recaptcha: recaptchaToken || '' });
            } else {
                createEmployeeMutation.mutate({ ...data, recaptcha: recaptchaToken || '' });
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

    return (
        <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
            <Stack spacing={3}>
                <Typography variant="h5">
                    {employeeId ? employee ? employee.name : t('srv_employee_not_found') : t('misc_new_employee')}
                </Typography>
                {employee || !employeeId ? (
                    <FormProvider {...mainForm}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid2 container spacing={2}>
                                <Grid2 size={{ xs: 12 }}>
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
                                </Grid2>
                                <Grid2 size={{ xs: 12 }}>
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
                                </Grid2>
                                <Grid2 size={{ xs: 12 }}>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                fullWidth
                                                label={t('misc_telephone')}
                                                variant="outlined"
                                                error={fieldState.invalid}
                                                helperText={fieldState.error?.message && t(fieldState.error.message)}
                                            />
                                        )}
                                    />
                                </Grid2>
                                <Grid2 size={{ xs: 12 }}>
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
                                </Grid2>
                            </Grid2>
                            <Grid2 container spacing={2} sx={{ mt: 3 }}>
                                <Grid2 size={{ xs: 12 }}>
                                    {postMsg && <FeedbackMessage message={postMsg} />}
                                </Grid2>
                                <Grid2 size={{ xs: 12 }}>
                                    <Stack direction="row" spacing={1}>
                                        <LoadingButton sx={{ minWidth: '200px' }} variant="contained" color="success" type="submit" loading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending} disabled={deleteEmployeeMutation.isPending || !_.isEmpty(errors)}>
                                            {employeeId ? t('misc_save') : t('misc_create')}
                                        </LoadingButton>
                                        {checkPrivileges('deleteEmployee', user?.role) && employeeId &&
                                            <LoadingButton sx={{ minWidth: '200px' }} variant="outlined" color="error" loading={deleteEmployeeMutation.isPending} disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending} onClick={handleDelete}>
                                                {t('misc_delete')}
                                            </LoadingButton>}
                                    </Stack>
                                </Grid2>
                            </Grid2>
                        </form>
                    </FormProvider>
                ) : (
                    <Typography variant='h6'>{t('srv_employee_not_found')}</Typography>
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
