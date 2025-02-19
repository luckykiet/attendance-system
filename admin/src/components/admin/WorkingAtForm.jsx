import {
    Container,
    Card,
    CardContent,
    Typography,
    TextField,
    Grid2,
    Stack,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Divider,
    FormControl,
    FormLabel
} from '@mui/material';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import { DAYS_OF_WEEK, getDefaultAttendance, getDefaultWorkingAt, TIME_FORMAT, timeStartEndValidation } from '@/utils';
import useTranslation from '@/hooks/useTranslation';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSetAlertMessage } from '@/stores/root';
import { createOrUpdateWorkingAt } from '@/api/working-at';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import FeedbackMessage from '../FeedbackMessage';
import WorkingHoursInputs from '../WorkingHoursInputs';
import { LoadingButton } from '@mui/lab';
import _ from 'lodash';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fetchAttendanceByEmployeeAndDate } from '@/api/attendances';
import LoadingCircle from '../LoadingCircle';
import { updateAttendance } from '@/api/attendance';
import { useConfigStore } from '@/stores/config';

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

const attendanceSchema = z.object({
    _id: z.string().optional(),
    checkInTime: z
        .any()
        .refine((time) => time === null || (dayjs.isDayjs(time) && time.isValid()), {
            message: 'srv_invalid_time_format',
        }),
    checkOutTime: z
        .any()
        .refine((time) => time === null || (dayjs.isDayjs(time) && time.isValid()), {
            message: 'srv_invalid_time_format',
        }),
}).refine(
    ({ checkInTime, checkOutTime }) => {
        if (dayjs.isDayjs(checkInTime) && dayjs.isDayjs(checkOutTime)) {
            return checkInTime.isBefore(checkOutTime);
        }
        return true;
    },
    {
        message: 'srv_close_time_before_open_time',
        path: ['checkOutTime'],
    }
);

export default function WorkingAtForm({ employeeId, register, workingAt }) {
    const { t } = useTranslation()
    const config = useConfigStore();
    const today = dayjs();
    const [postMsg, setPostMsg] = useState('');
    const [postAttendanceMsg, setPostAttendanceMsg] = useState('');
    const setAlertMessage = useSetAlertMessage();
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);
    const [date, setDate] = useState(today);

    const dateForm = useForm({
        mode: 'all',
        resolver: zodResolver(attendanceSchema),
        defaultValues: getDefaultAttendance(),
    });

    const { reset: attendanceReset } = dateForm;

    const mainForm = useForm({
        resolver: zodResolver(workingAtSchema),
        defaultValues: getDefaultWorkingAt(),
    });

    const { watch, control, handleSubmit, reset, formState: { dirtyFields, errors } } = mainForm;

    const attendanceQuery = useQuery({
        queryKey: ['employee-attendance', { employeeId, date, registerId: register._id }],
        queryFn: () => fetchAttendanceByEmployeeAndDate({ employeeId, registerId: register._id, date: dayjs(date).format('YYYYMMDD') }),
        enabled: !!employeeId && !!date && !errors.date,
    });

    const { data: attendance } = attendanceQuery;

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

    const saveAttendanceMutation = useMutation({
        mutationFn: (data) => updateAttendance(data),
        onError: (error) => {
            setPostAttendanceMsg(new Error(error))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: 'srv_updated', severity: 'success' });
            console.log(data)
            attendanceReset({ ...data, checkInTime: data.checkInTime ? dayjs(data.checkInTime) : null, checkOutTime: data.checkOutTime ? dayjs(data.checkOutTime) : null });
        }
    })

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptchaToken = await executeRecaptcha(`${register ? 'update' : 'create'}register`);

            saveWorkingAtMutation.mutate({ ...data, registerId: register._id, employeeId, recaptcha: recaptchaToken });
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    }

    const onAttendanceSubmit = async (data) => {
        try {
            setPostAttendanceMsg('');
            const recaptchaToken = await executeRecaptcha(`updateRegister`);
            saveAttendanceMutation.mutate({ ...data, recaptcha: recaptchaToken });
        }
        catch (error) {
            setPostAttendanceMsg(error instanceof Error ? error : new Error(error));
        }
    }

    useEffect(() => {
        if (workingAt) {
            reset({ ...getDefaultWorkingAt(), ...workingAt });
        }
    }, [reset, workingAt]);

    useEffect(() => {
        if (attendance) {
            setPostAttendanceMsg('');
            attendanceReset({ ...attendance, checkInTime: attendance.checkInTime ? dayjs(attendance.checkInTime) : null, checkOutTime: attendance.checkOutTime ? dayjs(attendance.checkOutTime) : null });
        }
    }, [attendance, attendanceReset]);

    if (!register || !employeeId) {
        return <Container maxWidth="md" sx={{ my: 4 }}>
            <Typography variant="h6" gutterBottom>
                {t('misc_no_register_selected')}
            </Typography>
        </Container>
    }

    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-content-${register._id}`}
                id={`panel-header-${register._id}`}>{register.name} - {register.address.street}, {register.address.city} {register.address.zip}</AccordionSummary>
            <AccordionDetails>
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <Grid2 container spacing={3}>
                                <Grid2 size={{ xs: 12 }}>
                                    <FormProvider {...mainForm}>
                                        <form onSubmit={handleSubmit(onSubmit)}>
                                            <Stack spacing={2}>
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
                                                <Typography variant="h5">{t('misc_working_hours')}</Typography>
                                                <WorkingHoursInputs />
                                                {postMsg && <FeedbackMessage message={postMsg} />}
                                                <LoadingButton sx={{ minWidth: '200px' }} variant="contained" color={workingAt ? "primary" : "success"} type="submit" loading={saveWorkingAtMutation.isPending} disabled={!_.isEmpty(errors) || _.isEmpty(dirtyFields)}>
                                                    {workingAt ? t('misc_save') : t('misc_create')}
                                                </LoadingButton>
                                            </Stack>
                                        </form>
                                    </FormProvider>
                                </Grid2>
                                {register &&
                                    <>
                                        <Grid2 size={{ xs: 12 }}>
                                            <Divider />
                                        </Grid2>
                                        <Grid2 size={{ xs: 12, sm: 6 }}>
                                            <Typography variant='h5'>
                                                {t('misc_attendance')}
                                            </Typography>
                                        </Grid2>
                                        <Grid2 size={{ xs: 12, sm: 6 }}>
                                            <FormControl fullWidth>
                                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                    <DatePicker
                                                        disableFuture
                                                        label={t('misc_date')}
                                                        sx={{ width: '100%' }}
                                                        maxDate={today}
                                                        views={['year', 'month', 'day']}
                                                        value={date}
                                                        onChange={(date) => setDate(date)}
                                                    />
                                                </LocalizationProvider>
                                            </FormControl>
                                        </Grid2>
                                        <Grid2 size={{ xs: 12 }}>
                                            {attendanceQuery.isLoading || attendanceQuery.isFetching ? <LoadingCircle /> :
                                                attendance ?
                                                    <FormProvider {...dateForm}>
                                                        <form onSubmit={dateForm.handleSubmit(onAttendanceSubmit)}>
                                                            <Grid2 container spacing={2}>
                                                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                                                    {attendance.checkInTime ?
                                                                        <Stack spacing={1}>
                                                                            <Controller
                                                                                name="checkInTime"
                                                                                control={dateForm.control}
                                                                                render={({ field, fieldState }) => {
                                                                                    const dayIndex = date.day();
                                                                                    const dayKey = DAYS_OF_WEEK[dayIndex];
                                                                                    return <FormControl fullWidth>
                                                                                        <Stack spacing={1}>
                                                                                            <FormLabel>{t('misc_check_in')}</FormLabel>
                                                                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                                                                <TimePicker
                                                                                                    {...field}
                                                                                                    value={field.value ? dayjs(field.value) : null}
                                                                                                    maxTime={dayjs(
                                                                                                        watch(`workingHours[${dayKey}].end`),
                                                                                                        TIME_FORMAT
                                                                                                    )}
                                                                                                    id={`picker-${employeeId}-${dayKey}-start`}
                                                                                                    format={TIME_FORMAT}
                                                                                                    disabled={!watch(`workingHours[${dayKey}].isAvailable`)}
                                                                                                    views={['hours', 'minutes']}
                                                                                                    slotProps={{
                                                                                                        textField: {
                                                                                                            fullWidth: true,
                                                                                                            variant: 'outlined',
                                                                                                            error: fieldState.invalid,
                                                                                                            helperText: fieldState.invalid && t(fieldState.error.message),
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            </LocalizationProvider>
                                                                                        </Stack>
                                                                                    </FormControl>
                                                                                }}
                                                                            />
                                                                            {attendance.checkInLocation.latitude && <Typography variant='body1'>{t('misc_latitude')}: {attendance.checkInLocation.latitude}</Typography>}
                                                                            {attendance.checkInLocation.longitude && <Typography variant='body1'>{t('misc_longitude')}: {attendance.checkInLocation.longitude}</Typography>}
                                                                            {attendance.checkInLocation.distance && <Typography variant='body1'>{t('misc_distance')}: {Math.floor(attendance.checkInLocation.distance)}m</Typography>}
                                                                        </Stack>
                                                                        : <Typography>{t('misc_check_in')}: -</Typography>}
                                                                </Grid2>
                                                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                                                    {attendance.checkOutTime ?
                                                                        <Stack spacing={1}>
                                                                            <Controller
                                                                                name="checkOutTime"
                                                                                control={dateForm.control}
                                                                                render={({ field, fieldState }) => {
                                                                                    const dayIndex = date.day();
                                                                                    const dayKey = DAYS_OF_WEEK[dayIndex];
                                                                                    return <FormControl fullWidth>
                                                                                        <Stack spacing={1}>
                                                                                            <FormLabel>{t('misc_check_out')}</FormLabel>
                                                                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                                                                <TimePicker
                                                                                                    {...field}
                                                                                                    value={field.value ? dayjs(field.value) : null}
                                                                                                    minTime={dayjs(
                                                                                                        watch(`workingHours[${dayKey}].start`),
                                                                                                        TIME_FORMAT
                                                                                                    )}
                                                                                                    maxTime={dayjs(
                                                                                                        watch(`workingHours[${dayKey}].end`),
                                                                                                        TIME_FORMAT
                                                                                                    )}
                                                                                                    id={`picker-${employeeId}-${dayKey}-end`}
                                                                                                    format={TIME_FORMAT}
                                                                                                    disabled={!watch(`workingHours[${dayKey}].isAvailable`)}
                                                                                                    views={['hours', 'minutes']}
                                                                                                    slotProps={{
                                                                                                        textField: {
                                                                                                            fullWidth: true,
                                                                                                            variant: 'outlined',
                                                                                                            error: fieldState.invalid,
                                                                                                            helperText: fieldState.invalid && t(fieldState.error.message),
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            </LocalizationProvider>
                                                                                        </Stack>
                                                                                    </FormControl>
                                                                                }}
                                                                            />
                                                                            {attendance.checkOutLocation.latitude && <Typography variant='body1'>{t('misc_latitude')}: {attendance.checkOutLocation.latitude}</Typography>}
                                                                            {attendance.checkOutLocation.longitude && <Typography variant='body1'>{t('misc_longitude')}: {attendance.checkOutLocation.longitude}</Typography>}
                                                                            {attendance.checkOutLocation.distance && <Typography variant='body1'>{t('misc_distance')}: {Math.floor(attendance.checkOutLocation.distance)}m</Typography>}
                                                                        </Stack>
                                                                        : <Typography>{t('misc_check_out')}: -</Typography>}
                                                                </Grid2>
                                                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                                                    <LoadingButton sx={{ minWidth: '200px' }} variant="contained" color={"success"} type="submit" loading={saveAttendanceMutation.isPending}>
                                                                        {t('misc_save')}
                                                                    </LoadingButton>
                                                                </Grid2>
                                                                <Grid2 size={{ xs: 12 }}>
                                                                    {postAttendanceMsg && <FeedbackMessage message={postAttendanceMsg} />}
                                                                </Grid2>
                                                            </Grid2>
                                                        </form>
                                                    </FormProvider>
                                                    :
                                                    <Typography variant='h6'>{t('srv_attendance_not_found')}</Typography>}
                                        </Grid2>
                                    </>}
                            </Grid2>
                        </Stack>
                    </CardContent>
                </Card>
            </AccordionDetails >
        </Accordion >
    );
}

WorkingAtForm.propTypes = {
    employeeId: PropTypes.string.isRequired,
    register: PropTypes.object.isRequired,
    workingAt: PropTypes.object,
}