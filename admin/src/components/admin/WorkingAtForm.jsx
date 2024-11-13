import {
    Container,
    Card,
    CardContent,
    Typography,
    TextField,
    Grid2,
    Stack,
} from '@mui/material';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import { getDefaultWorkingAt, TIME_FORMAT, timeStartEndValidation } from '@/utils';
import useTranslation from '@/hooks/useTranslation';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSetAlertMessage } from '@/stores/root';
import { createOrUpdateWorkingAt } from '@/api/working-at';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { CONFIG } from '@/configs';
import FeedbackMessage from '../FeedbackMessage';
import WorkingHoursInputs from '../WorkingHoursInputs';
import { LoadingButton } from '@mui/lab';
import _ from 'lodash';

dayjs.extend(customParseFormat);

const workingHourSchema = z.object({
    start: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
    end: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
    isAvailable: z.boolean(),
}).refine(({ start, end }) => timeStartEndValidation(start, end), {
    message: 'srv_close_time_before_open_time',
    path: ['close'],
})

const workingAtSchema = z.object({
    position: z.string().optional(),
    workingHours: z.object({
        mon: workingHourSchema,
        tue: workingHourSchema,
        wed: workingHourSchema,
        thu: workingHourSchema,
        fri: workingHourSchema,
        sat: workingHourSchema,
        sun: workingHourSchema,
    }),
});

export default function WorkingAtForm({ employeeId, register, workingAt }) {
    const { t } = useTranslation()
    const [postMsg, setPostMsg] = useState('');
    const setAlertMessage = useSetAlertMessage();
    const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);

    const methods = useForm({
        resolver: zodResolver(workingAtSchema),
        defaultValues: getDefaultWorkingAt(),
    });

    const { control, handleSubmit, reset, formState: { dirtyFields, errors } } = methods;

    const saveWorkingAtMutation = useMutation({
        mutationFn: (data) => createOrUpdateWorkingAt(data),
        onError: (error) => {
            setPostMsg(new Error(error))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: workingAt ? 'srv_updated' : 'srv_created', severity: 'success' });
            reset({ ...getDefaultWorkingAt(), ...data });
        }
    })

    const onSubmit = async (data) => {
        try {
            const recaptchaToken = await executeRecaptcha(`${register ? 'update' : 'create'}register`);

            if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
                throw new Error(t('srv_invalid_recaptcha'));
            }

            saveWorkingAtMutation.mutate({ ...data, registerId: register._id, employeeId, recaptcha: recaptchaToken || '' });
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    }

    useEffect(() => {
        if (workingAt) {
            reset({ ...getDefaultWorkingAt(), ...workingAt });
        }
    }, [reset, workingAt]);

    if (!register || !employeeId) {
        return <Container maxWidth="md" sx={{ my: 4 }}>
            <Typography variant="h6" gutterBottom>
                {t('misc_no_register_selected')}
            </Typography>
        </Container>
    }

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" gutterBottom>
                                    {register.name}
                                </Typography>
                                <Typography variant="body1">
                                    {register.address.street}, {register.address.city} {register.address.zip}
                                </Typography>
                                <Grid2 container spacing={3}>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="position"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('misc_position')}
                                                    variant="outlined"
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.invalid && t(fieldState.error.message)}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Typography variant="subtitle1">{t('misc_working_hours')}</Typography>
                                        <WorkingHoursInputs />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        {postMsg && <FeedbackMessage message={postMsg} />}
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }} sx={{ mt: 3 }}>
                                        <LoadingButton sx={{ minWidth: '200px' }} variant="contained" color={workingAt ? "primary" : "success"} type="submit" loading={saveWorkingAtMutation.isPending} disabled={!_.isEmpty(errors) || _.isEmpty(dirtyFields)}>
                                            {workingAt ? t('misc_save') : t('misc_create')}
                                        </LoadingButton>
                                    </Grid2>
                                </Grid2>
                            </Stack>
                        </CardContent>
                    </Card>
                </form>
            </FormProvider>
        </Container >
    );
}

WorkingAtForm.propTypes = {
    employeeId: PropTypes.string.isRequired,
    register: PropTypes.object.isRequired,
    workingAt: PropTypes.object,
}