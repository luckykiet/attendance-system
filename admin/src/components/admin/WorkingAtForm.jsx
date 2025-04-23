import {
    Container,
    Card,
    CardContent,
    Typography,
    TextField,
    Grid,
    Stack,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Divider,
    FormControl,
    Button,
    FormControlLabel,
    FormGroup,
    Switch,
    InputAdornment,
} from '@mui/material';
import { useForm, Controller, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import { daysOfWeeksTranslations, getDaysOfWeek, getDefaultAttendance, getDefaultShift, getDefaultWorkingAt, getDurationLabel, getStartEndTime, TIME_FORMAT } from '@/utils';
import useTranslation from '@/hooks/useTranslation';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSetAlertMessage } from '@/stores/root';
import { createOrUpdateWorkingAt } from '@/api/working-at';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import FeedbackMessage from '../FeedbackMessage';
import _ from 'lodash';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fetchAttendanceByEmployeeAndDate } from '@/api/attendances';
import LoadingCircle from '../LoadingCircle';
import { updateAttendance } from '@/api/attendance';
import { useConfigStore } from '@/stores/config';
import AttendanceSchema from '@/schemas/attendance';
import WorkingAtSchema from '@/schemas/working-at';
import CustomPopover from '../CustomPopover';

dayjs.extend(customParseFormat);

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
        resolver: zodResolver(AttendanceSchema),
        defaultValues: getDefaultAttendance(),
    });

    const { reset: attendanceReset } = dateForm;

    const mainForm = useForm({
        resolver: zodResolver(WorkingAtSchema),
        defaultValues: getDefaultWorkingAt(),
    });

    const { watch, control, handleSubmit, reset, setValue, formState: { dirtyFields, errors } } = mainForm;

    const shiftFieldArrays = {
        mon: useFieldArray({ control, name: 'shifts.mon' }),
        tue: useFieldArray({ control, name: 'shifts.tue' }),
        wed: useFieldArray({ control, name: 'shifts.wed' }),
        thu: useFieldArray({ control, name: 'shifts.thu' }),
        fri: useFieldArray({ control, name: 'shifts.fri' }),
        sat: useFieldArray({ control, name: 'shifts.sat' }),
        sun: useFieldArray({ control, name: 'shifts.sun' }),
    };

    const attendanceQuery = useQuery({
        queryKey: ['employee-attendance', { employeeId, date, registerId: register._id }],
        queryFn: () => fetchAttendanceByEmployeeAndDate({ employeeId, registerId: register._id, date: dayjs(date).format('YYYYMMDD') }),
        enabled: !!employeeId && !!date && !errors.date,
    });

    const { data: attendance } = attendanceQuery;

    const saveWorkingAtMutation = useMutation({
        mutationFn: (data) => createOrUpdateWorkingAt(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
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
            attendanceReset({ ...data, checkInTime: data.checkInTime ? dayjs(data.checkInTime) : null, checkOutTime: data.checkOutTime ? dayjs(data.checkOutTime) : null });
        }
    })

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptcha = await executeRecaptcha(`${register ? 'update' : 'create'}register`);

            saveWorkingAtMutation.mutate({ ...data, registerId: register._id, employeeId, recaptcha });
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    }

    const onAttendanceSubmit = async (data) => {
        try {
            setPostAttendanceMsg('');
            const recaptcha = await executeRecaptcha(`updateRegister`);
            saveAttendanceMutation.mutate({ ...data, recaptcha });
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
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
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
                                                <Divider />
                                                {getDaysOfWeek(true).map((day) => {
                                                    const { fields, append, remove } = shiftFieldArrays[day];

                                                    return (
                                                        <Stack key={day} spacing={2}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="h5">{t(daysOfWeeksTranslations[day].name)}</Typography>
                                                                <Button variant="outlined" onClick={() => append(getDefaultShift())}>
                                                                    {t('misc_add_shift')}
                                                                </Button>
                                                            </Stack>
                                                            <Stack spacing={4}>
                                                                {fields.length ? fields.map((field, index) => {
                                                                    const fieldKey = `shifts.${day}.${index}`;
                                                                    return <Grid key={field.id} container spacing={2} border={1} borderColor={'grey.300'} borderRadius={2} padding={2}>
                                                                        <Grid size={{ xs: 12 }} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                                                                            <Typography variant="h6">{t('misc_shift')} {index + 1}</Typography>
                                                                            <Controller
                                                                                name={`${fieldKey}.isAvailable`}
                                                                                control={control}
                                                                                render={({ field: { ref, ...field } }) => (
                                                                                    <FormGroup>
                                                                                        <FormControlLabel
                                                                                            inputRef={ref}
                                                                                            label={t('misc_available')}
                                                                                            labelPlacement="start"
                                                                                            control={
                                                                                                <Switch
                                                                                                    size="large"
                                                                                                    checked={field.value}
                                                                                                    {...field}
                                                                                                    color="success"
                                                                                                    onBlur={handleSubmit}
                                                                                                    id={`switch-${day}-${index}-isAvailable`}
                                                                                                />
                                                                                            }
                                                                                        />
                                                                                    </FormGroup>
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                                            <Controller
                                                                                name={`${fieldKey}.start`}
                                                                                control={control}
                                                                                render={({ field, fieldState }) => (
                                                                                    <FormControl fullWidth>
                                                                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                                                            <TimePicker
                                                                                                {...field}
                                                                                                value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                                                                onChange={(date) => {
                                                                                                    const formattedDate = date.format(TIME_FORMAT);
                                                                                                    const endTime = dayjs(watch(`${fieldKey}.end`), TIME_FORMAT);
                                                                                                    const isOverNight = date.isAfter(endTime);

                                                                                                    setValue(`${fieldKey}.isOverNight`, isOverNight);
                                                                                                    field.onChange(formattedDate);
                                                                                                }}
                                                                                                label={t('msg_from')}
                                                                                                id={`picker-${day}-${index}-start`}
                                                                                                format={TIME_FORMAT}
                                                                                                disabled={!watch(`${fieldKey}.isAvailable`)}
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
                                                                                    </FormControl>
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                                            <Controller
                                                                                name={`${fieldKey}.end`}
                                                                                control={control}
                                                                                render={({ field, fieldState }) => (
                                                                                    <FormControl fullWidth>
                                                                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                                                            <TimePicker
                                                                                                {...field}
                                                                                                value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                                                                onChange={(date) => {
                                                                                                    const formattedDate = date.format(TIME_FORMAT);
                                                                                                    const startTime = dayjs(watch(`${fieldKey}.start`), TIME_FORMAT);
                                                                                                    const isOverNight = startTime.isAfter(date);

                                                                                                    setValue(`${fieldKey}.isOverNight`, isOverNight);
                                                                                                    field.onChange(formattedDate);
                                                                                                }}
                                                                                                label={t('msg_to')}
                                                                                                id={`picker-${day}-${index}-end`}
                                                                                                format={TIME_FORMAT}
                                                                                                disabled={!watch(`${fieldKey}.isAvailable`)}
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
                                                                                    </FormControl>
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12 }}>
                                                                            <Grid container spacing={2}>
                                                                                <Grid size={{ xs: 6 }}>
                                                                                    <Controller
                                                                                        name={`${fieldKey}.isOverNight`}
                                                                                        control={control}
                                                                                        render={({ field }) =>
                                                                                            field.value ? (
                                                                                                <Typography variant="body1" color="warning">
                                                                                                    {t('misc_over_night')}
                                                                                                </Typography>
                                                                                            ) : null
                                                                                        }
                                                                                    />
                                                                                </Grid>
                                                                                <Grid size={{ xs: 6 }}>
                                                                                    <Typography variant="body1">
                                                                                        {t('misc_duration')}:{' '}
                                                                                        {getDurationLabel(
                                                                                            watch(`${fieldKey}.start`),
                                                                                            watch(`${fieldKey}.end`),
                                                                                        )}
                                                                                    </Typography>
                                                                                </Grid>
                                                                            </Grid>
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                            <Controller
                                                                                name={`${fieldKey}.allowedOverTime`}
                                                                                control={control}
                                                                                render={({ field, fieldState }) => (
                                                                                    <TextField
                                                                                        {...field}
                                                                                        label={`${t('misc_allowed_overtime')} (${t('misc_minutes')})`}
                                                                                        type="number"
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            if (!isNaN(value)) {
                                                                                                field.onChange(parseInt(value));
                                                                                            }
                                                                                        }}
                                                                                        slotProps={{
                                                                                            input: {
                                                                                                startAdornment: (
                                                                                                    <InputAdornment position="start">
                                                                                                        <CustomPopover
                                                                                                            content={<Stack spacing={1}>
                                                                                                                <Typography variant="body2">{t('misc_allowed_overtime_desc')}</Typography>
                                                                                                            </Stack>}
                                                                                                        />
                                                                                                    </InputAdornment>
                                                                                                ),
                                                                                            },
                                                                                        }}
                                                                                        variant="outlined"
                                                                                        error={fieldState.invalid}
                                                                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                                                                    />
                                                                                )}
                                                                            />
                                                                            <Button color="error" onClick={() => remove(index)}>
                                                                                {t('misc_remove')}
                                                                            </Button>
                                                                        </Grid>
                                                                    </Grid>
                                                                }) : <Typography variant='body1' textAlign={'center'}>{t('misc_no_shifts')}</Typography>}
                                                            </Stack>
                                                        </Stack>
                                                    );
                                                })}
                                                <Divider />
                                                {postMsg && <FeedbackMessage message={postMsg} />}
                                                <Button sx={{ minWidth: '200px' }} variant="contained" color={workingAt ? "primary" : "success"} type="submit" loading={saveWorkingAtMutation.isPending} disabled={!_.isEmpty(errors) || _.isEmpty(dirtyFields)}>
                                                    {workingAt ? t('misc_save') : t('misc_create')}
                                                </Button>
                                            </Stack>
                                        </form>
                                    </FormProvider>
                                </Grid>
                                {register &&
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <Divider />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant='h5'>
                                                {t('misc_attendance')}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
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
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            {attendanceQuery.isLoading || attendanceQuery.isFetching ? <LoadingCircle /> :
                                                attendance ?
                                                    <FormProvider {...dateForm}>
                                                        <form onSubmit={dateForm.handleSubmit(onAttendanceSubmit)}>
                                                            <Grid container spacing={2}>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Stack spacing={1}>
                                                                        <Typography variant='h6'>{t('misc_shift')}</Typography>
                                                                        {(() => {
                                                                            const shiftTime = getStartEndTime({ start: attendance.start, end: attendance.end });
                                                                            if (!shiftTime) return null;
                                                                            const { startTime, endTime, isOverNight } = shiftTime;
                                                                            return (
                                                                                <Stack direction={'row'} spacing={2}>
                                                                                    <Typography variant='body1'>{startTime.format(TIME_FORMAT)} - {endTime.format(TIME_FORMAT)}{isOverNight ? `(${t('misc_over_night')})` : ''}</Typography>
                                                                                    <Typography variant='body1'>{t('misc_duration')}: {getDurationLabel(attendance.start, attendance.end)}</Typography>
                                                                                </Stack>
                                                                            )
                                                                        })()}
                                                                    </Stack>
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Divider />
                                                                </Grid>
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    {attendance.checkInTime ?
                                                                        <Stack spacing={1}>
                                                                            <Typography>{t('misc_check_in')}: {dayjs(attendance.checkInTime).format('DD/MM/YYYY HH:mm:ss')}</Typography>
                                                                            {/* <Controller
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
                                                                            /> */}
                                                                            {attendance.checkInLocation.latitude && <Typography variant='body1'>{t('misc_latitude')}: {attendance.checkInLocation.latitude}</Typography>}
                                                                            {attendance.checkInLocation.longitude && <Typography variant='body1'>{t('misc_longitude')}: {attendance.checkInLocation.longitude}</Typography>}
                                                                            {attendance.checkInLocation.distance && <Typography variant='body1'>{t('misc_distance')}: {Math.floor(attendance.checkInLocation.distance)}m</Typography>}
                                                                        </Stack>
                                                                        : <Typography>{t('misc_check_in')}: -</Typography>}
                                                                </Grid>
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    {attendance.checkOutTime ?
                                                                        <Stack spacing={1}>
                                                                            {/* <Controller
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
                                                                            /> */}
                                                                            <Typography>{t('misc_check_out')}: {dayjs(attendance.checkOutTime).format('DD/MM/YYYY HH:mm:ss')}</Typography>
                                                                            {attendance.checkOutLocation?.latitude && <Typography variant='body1'>{t('misc_latitude')}: {attendance.checkOutLocation.latitude}</Typography>}
                                                                            {attendance.checkOutLocation?.longitude && <Typography variant='body1'>{t('misc_longitude')}: {attendance.checkOutLocation.longitude}</Typography>}
                                                                            {attendance.checkOutLocation?.distance && <Typography variant='body1'>{t('misc_distance')}: {Math.floor(attendance.checkOutLocation.distance)}m</Typography>}
                                                                            {attendance.reason && <Typography variant='body1'>{t('misc_reason')}: {attendance.reason}</Typography>}
                                                                        </Stack>
                                                                        : <Typography>{t('misc_check_out')}: -</Typography>}
                                                                </Grid>
                                                                {/* <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Button sx={{ minWidth: '200px' }} variant="contained" color={"success"} type="submit" loading={saveAttendanceMutation.isPending}>
                                                                        {t('misc_save')}
                                                                    </Button>
                                                                </Grid> */}
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Divider />
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Typography variant='h6'>{t('misc_pauses')}</Typography>
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    {attendance.pauses && attendance.pauses.length > 0 ? attendance.pauses.map((pause, index) => {
                                                                        const startTime = dayjs(pause.checkInTime);
                                                                        const endTime = dayjs(pause.checkOutTime);
                                                                        return (
                                                                            <Grid container spacing={2} key={index}>
                                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                                    <Stack spacing={1}>
                                                                                        <Typography variant='body1'>{t('misc_start_time')}: {pause.checkInTime ? startTime.format('DD/MM/YYYY HH:mm:ss') : ' -'}</Typography>
                                                                                        <Typography variant='body1'>{t('misc_end_time')}: {pause.checkOutTime ? endTime.format('DD/MM/YYYY HH:mm:ss') : ' -'}</Typography>
                                                                                        <Typography variant='body1'>{t('misc_duration')}: {getDurationLabel(startTime, endTime)}</Typography>
                                                                                    </Stack>
                                                                                </Grid>
                                                                            </Grid>
                                                                        );
                                                                    }) : <Typography variant='body1' textAlign={'center'}>{t('misc_no_pauses')}</Typography>}
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Divider />
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Typography variant='h6'>{t('misc_breaks')}</Typography>
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    {attendance.breaks && attendance.breaks.length > 0 ? attendance.breaks.map((brk, index) => {
                                                                        const breakTime = getStartEndTime({ start: brk.breakHours.start, end: brk.breakHours.end });
                                                                        if (!breakTime) return null;
                                                                        const startTime = dayjs(brk.checkInTime);
                                                                        const endTime = dayjs(brk.checkOutTime);

                                                                        return (
                                                                            <Grid container spacing={2} key={index}>
                                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                                    <Stack spacing={1}>
                                                                                        <Typography variant='body1'>{t('misc_break')}: {t(brk.name)}</Typography>
                                                                                        <Typography variant='body1'>{breakTime.startTime.format(TIME_FORMAT)} - {breakTime.endTime.format(TIME_FORMAT)}{breakTime.isOverNight ? t('misc_over_night') : ''}</Typography>
                                                                                        <Typography variant='body1'>{t('misc_check_in')}: {brk.checkInTime ? startTime.format('DD/MM/YYYY HH:mm:ss') : ' -'}</Typography>
                                                                                        <Typography variant='body1'>{t('misc_check_out')}: {brk.checkOutTime ? endTime.format('DD/MM/YYYY HH:mm:ss') : ' -'}</Typography>
                                                                                        <Typography variant='body1'>{t('misc_duration')}: {getDurationLabel(startTime, endTime)}</Typography>
                                                                                    </Stack>
                                                                                </Grid>
                                                                            </Grid>
                                                                        );
                                                                    }) : <Typography variant='body1' textAlign={'center'}>{t('misc_no_breaks')}</Typography>}
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    {postAttendanceMsg && <FeedbackMessage message={postAttendanceMsg} />}
                                                                </Grid>
                                                            </Grid>
                                                        </form>
                                                    </FormProvider>
                                                    :
                                                    <Typography variant='h6'>{t('srv_attendance_not_found')}</Typography>}
                                        </Grid>
                                    </>}
                            </Grid>
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