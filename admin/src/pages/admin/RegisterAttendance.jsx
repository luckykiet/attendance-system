import { useEffect, useState } from 'react';
import { Container, Link, Typography, FormHelperText, FormControl, Stack, Grid, Divider, TableContainer, Table, TableCell, Paper, TableHead, TableRow, TableBody } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import dayjs from 'dayjs';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchAttendanceByRegisterAndDate } from '@/api/attendances';
import useTranslation from '@/hooks/useTranslation';
import FeedbackMessage from '@/components/FeedbackMessage';
import LoadingCircle from '@/components/LoadingCircle';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fetchRegister } from '@/api/register';
import { CSVLink } from 'react-csv';
import { getDiffDurationText } from '@/utils';

dayjs.extend(customParseFormat);

const employeeSchema = z.object({
    date: z.preprocess((value) => {
        const parsedDate = dayjs(value);
        return parsedDate.isValid() ? parsedDate.toDate() : undefined;
    }, z.date().refine(val => !!val, { message: 'misc_required' }).optional()),
});

const RegisterAttendance = () => {
    const { registerId } = useParams();
    const { t } = useTranslation();
    const { t: noCap } = useTranslation({ capitalize: false });
    const [postMsg, setPostMsg] = useState('');
    const today = dayjs();
    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(employeeSchema),
        defaultValues: { date: today },
    });

    const {
        control,
        watch,
        formState: { errors },
    } = mainForm;

    const date = watch('date');

    const registerQuery = useQuery({
        queryKey: ['register', registerId],
        queryFn: () => fetchRegister(registerId),
        enabled: !!registerId,
    })

    const { data: register, isLoading: isRegisterLoading, isFetching: isRegisterFetching, isSuccess: isRegisterSuccess } = registerQuery;

    const attendanceQuery = useQuery({
        queryKey: ['register-attendance', { registerId, date }],
        queryFn: () => fetchAttendanceByRegisterAndDate({ registerId, date: dayjs(date).format('YYYYMMDD') }),
        enabled: !!registerId && !!date && !errors.date && isRegisterSuccess,
    });

    const { data, isLoading, isFetching, error, refetch } = attendanceQuery;

    const csvData = data?.dailyAttendance?.expectedShifts.map((shift) => {
        const employee = data.employees.find(emp => emp._id === shift.employeeId);
        const matchingAttendance = data.attendances.find(att => att.shiftId === shift.shiftId);

        const isCheckInLate = matchingAttendance ? !!data.dailyAttendance.checkedInLateByEmployee[shift.employeeId] : false;
        const isCheckOutEarly = matchingAttendance ? !!data.dailyAttendance.checkedOutEarlyByEmployee[shift.employeeId] : false;

        let expectedBreakTime = 0;
        let actualBreakTime = 0;
        let actualPauseTime = 0;
        let actualWorkedHours = 0;
        if (matchingAttendance) {
            matchingAttendance.breaks.forEach((brk) => {
                if (brk.checkOutTime) {
                    actualBreakTime += dayjs(brk.checkOutTime).diff(dayjs(brk.checkInTime), 'minute');
                }
                expectedBreakTime += brk.breakHours?.duration || 0;
            });
            matchingAttendance.pauses.forEach((pause) => {
                if (pause.checkOutTime) {
                    actualPauseTime += dayjs(pause.checkOutTime).diff(dayjs(pause.checkInTime), 'minute');
                }
            });

            const endTime = matchingAttendance.checkOutTime ? dayjs(matchingAttendance.checkOutTime) : dayjs();
            actualWorkedHours = endTime.diff(dayjs(matchingAttendance.checkInTime), 'minute');
        }

        return {
            fullName: employee ? employee.name : shift.employeeId,
            email: employee ? employee.email : '',
            workingHour: `${shift.start} - ${shift.end}`,
            checkIn: matchingAttendance?.checkInTime ? dayjs(matchingAttendance.checkInTime).format('HH:mm:ss') + (isCheckInLate ? ` (${t('misc_late')})` : '') : '',
            checkOut: matchingAttendance?.checkOutTime ? dayjs(matchingAttendance.checkOutTime).format('HH:mm:ss') + (isCheckOutEarly ? ` (${t('misc_early')})` : '') : '',
            expectedBreakTimeInMinutes: expectedBreakTime,
            actualBreakTimeInMinutes: actualBreakTime,
            actualPauseTimeInMinutes: actualPauseTime,
            actualWorkedHoursInMinutes: actualWorkedHours,
        };
    }) || [];

    useEffect(() => {
        if (date) {
            refetch();
        }
    }, [date, refetch]);

    useEffect(() => {
        if (error) {
            setPostMsg(error.message);
        }
    }, [error]);

    return (
        <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
            <Stack spacing={4}>
                <Typography variant="h4" gutterBottom>{t('misc_attendance')}</Typography>
                {isRegisterLoading || isRegisterFetching ? <LoadingCircle /> :
                    register ? <>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Stack spacing={2}>
                                    <Typography variant="h5">{register.name}</Typography>
                                    <Typography variant="h6">{register.address.street}, {register.address.zip} {register.address.city}</Typography>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="date"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <DatePicker
                                                    {...field}
                                                    inputRef={field.ref}
                                                    label={t('misc_date')}
                                                    disableFuture
                                                    sx={{ width: '100%' }}
                                                    maxDate={today}
                                                    views={['year', 'month', 'day']}
                                                />
                                                {fieldState.invalid && (
                                                    <FormHelperText
                                                        sx={{
                                                            color: (theme) => theme.palette.error.main,
                                                        }}
                                                    >
                                                        {fieldState.error?.message}
                                                    </FormHelperText>
                                                )}
                                            </LocalizationProvider>
                                        </FormControl>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Divider />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                {isLoading || isFetching ? <LoadingCircle /> :
                                    data ? (() => {
                                        const { dailyAttendance } = data;
                                        const employeeIds = new Set(dailyAttendance.expectedShifts.map(shift => shift.employeeId));
                                        const totalCheckedIn = (parseInt(dailyAttendance.checkedInOnTime || 0)) + (parseInt(dailyAttendance.checkedInLate || 0));
                                        const totalCheckedOut = (parseInt(dailyAttendance.checkedOutOnTime || 0)) + (parseInt(dailyAttendance.checkedOutEarly || 0));
                                        return <Stack spacing={2}>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_working_hour_of_the_workplace')}:</Typography>
                                                <Typography variant="h6">
                                                    {dailyAttendance.workingHour.isAvailable ? `${dailyAttendance.workingHour.start} - ${dailyAttendance.workingHour.end}` : t('misc_closed')}
                                                </Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_total_shifts')}:</Typography>
                                                <Typography variant="h6">{dailyAttendance.expectedShifts.length || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_working_employees')}:</Typography>
                                                <Typography variant="h6">{employeeIds.size || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_checked_in')}:</Typography>
                                                <Typography variant="h6">{totalCheckedIn}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_checked_out')}:</Typography>
                                                <Typography variant="h6">{totalCheckedOut}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_checked_in_late')}:</Typography>
                                                <Typography color='error' variant="h6">{dailyAttendance.checkedInLate || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_checked_out_early')}:</Typography>
                                                <Typography color='error' variant="h6">{dailyAttendance.checkedOutEarly || 0}</Typography>
                                            </Stack>

                                            <Divider />

                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_not_provided_check_in')}:</Typography>
                                                <Typography color='error' variant="h6">{dailyAttendance.expectedShifts.length - totalCheckedIn}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_not_provided_check_out')}:</Typography>
                                                <Typography color='error' variant="h6">{dailyAttendance.expectedShifts.length - totalCheckedOut}</Typography>
                                            </Stack>
                                            <Divider />
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12 }}>
                                                    <Stack spacing={2}>
                                                        <Stack spacing={2} direction={'row'} justifyContent={'space-between'}>
                                                            <Typography variant="h6">{t('misc_attendances')}</Typography>
                                                            {csvData.length > 0 && <Stack direction="row" justifyContent="flex-end" mb={2}>
                                                                <CSVLink
                                                                    data={csvData}
                                                                    filename={`attendance-${dayjs(date).format('YYYYMMDD-HH:mm:ss')}.csv`}
                                                                    target="_blank"
                                                                    style={{ textDecoration: 'none' }}
                                                                >
                                                                    <Typography variant="button" sx={{ backgroundColor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                                                                        {t('misc_export_csv')}
                                                                    </Typography>
                                                                </CSVLink>
                                                            </Stack>}
                                                        </Stack>
                                                        <TableContainer component={Paper}>
                                                            <Table>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>{t('misc_full_name')}</TableCell>
                                                                        <TableCell>{t('misc_working_hour')}</TableCell>
                                                                        <TableCell>{t('misc_check_in')}</TableCell>
                                                                        <TableCell>{t('misc_check_out')}</TableCell>
                                                                        <TableCell>{t('misc_max_expected_break_time')}</TableCell>
                                                                        <TableCell>{t('misc_actual_break_time')}</TableCell>
                                                                        <TableCell>{t('misc_actual_pause_time')}</TableCell>
                                                                        <TableCell>{t('misc_actual_worked_hours')}</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {data.dailyAttendance.expectedShifts.length > 0 ? [...data.dailyAttendance.expectedShifts].sort((a, b) => {
                                                                        if (a.employeeId < b.employeeId) return -1;
                                                                        if (a.employeeId > b.employeeId) return 1;
                                                                        return a.start.localeCompare(b.start);
                                                                    })
                                                                        .map((shift) => {
                                                                            const employee = data.employees.find(emp => emp._id === shift.employeeId);
                                                                            const matchingAttendance = data.attendances.find(att => att.shiftId === shift.shiftId);

                                                                            const isCheckInLate = matchingAttendance ? !!data.dailyAttendance.checkedInLateByEmployee[shift.employeeId] : false;
                                                                            const isCheckOutEarly = matchingAttendance ? !!data.dailyAttendance.checkedOutEarlyByEmployee[shift.employeeId] : false;

                                                                            let expectedBreakTime = 0;
                                                                            let actualBreakTime = 0;
                                                                            let actualPauseTime = 0;
                                                                            let actualWorkedHours = 0;

                                                                            if (matchingAttendance) {
                                                                                matchingAttendance.breaks.forEach((brk) => {
                                                                                    if (brk.checkOutTime) {
                                                                                        actualBreakTime += dayjs(brk.checkOutTime).diff(dayjs(brk.checkInTime), 'minute');
                                                                                    }
                                                                                    expectedBreakTime += brk.breakHours?.duration || 0;
                                                                                });
                                                                                matchingAttendance.pauses.forEach((pause) => {
                                                                                    if (pause.checkOutTime) {
                                                                                        actualPauseTime += dayjs(pause.checkOutTime).diff(dayjs(pause.checkInTime), 'minute');
                                                                                    }
                                                                                });
                                                                                const endTime = matchingAttendance.checkOutTime ? dayjs(matchingAttendance.checkOutTime) : dayjs();
                                                                                actualWorkedHours = endTime.diff(dayjs(matchingAttendance.checkInTime), 'minute');
                                                                            }

                                                                            return (
                                                                                <TableRow key={shift._id}>
                                                                                    <TableCell>
                                                                                        {employee ? (
                                                                                            <Link component={RouterLink} target="_blank" to={`/employee/${employee._id}`} variant='h6'>
                                                                                                {employee.name}
                                                                                            </Link>
                                                                                        ) : shift.employeeId}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6'>
                                                                                            {shift.start} - {shift.end}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6' color={isCheckInLate ? 'error' : 'success'}>
                                                                                            {matchingAttendance?.checkInTime ? dayjs(matchingAttendance.checkInTime).format('HH:mm:ss') : '-'}
                                                                                            {isCheckInLate && ` - ${t('misc_late')}`}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6' color={isCheckOutEarly ? 'error' : 'success'}>
                                                                                            {matchingAttendance?.checkOutTime ? dayjs(matchingAttendance.checkOutTime).format('HH:mm:ss') : '-'}
                                                                                            {isCheckOutEarly && ` - ${t('misc_early')}`}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6'>
                                                                                            {expectedBreakTime > 0 ? getDiffDurationText(expectedBreakTime, noCap) : '-'}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6' color={actualBreakTime > expectedBreakTime ? 'error' : 'success'}>
                                                                                            {actualBreakTime > 0 ? getDiffDurationText(actualBreakTime, noCap) : '-'}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6' color={'error'}>
                                                                                            {actualPauseTime > 0 ? getDiffDurationText(actualPauseTime, noCap) : '-'}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Typography variant='h6' color={'success'}>
                                                                                            {getDiffDurationText(actualWorkedHours, noCap)}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        }) : (
                                                                        <TableRow>
                                                                            <TableCell colSpan={4} align="center">
                                                                                {t('srv_attendance_not_found')}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    })() : (
                                        <Typography textAlign={'center'} >{t('srv_attendance_not_found')}</Typography>
                                    )
                                }
                            </Grid>

                            {postMsg && <Grid size={{ xs: 12 }}><FeedbackMessage message={postMsg} /></Grid>}
                        </Grid>
                    </> : <Typography variant="h6" color='error'>{t('srv_register_not_found')}</Typography>
                }
            </Stack>
        </Container >
    );
};

export default RegisterAttendance;
