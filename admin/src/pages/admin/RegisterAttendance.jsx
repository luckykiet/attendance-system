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
                                    data ? (
                                        <Stack spacing={2}>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_working_hour')}:</Typography>
                                                <Typography variant="h6">{data.attendance.workingHour.isAvailable ? `${data.attendance.workingHour.start} - ${data.attendance.workingHour.end}` : t('misc_closed')}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_working_employees')}:</Typography>
                                                <Typography variant="h6">{data.employees.length || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_checked_in')}:</Typography>
                                                <Typography variant="h6">{data.attendance.checkIns?.length || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography variant="h6">{t('misc_checked_out')}:</Typography>
                                                <Typography variant="h6">{data.attendance.checkOuts?.length || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_missing')}:</Typography>
                                                <Typography color='error' variant="h6">{(data.attendance.employeeIds?.length - data.attendance.checkIns?.length) || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_checked_in_late')}:</Typography>
                                                <Typography color='error' variant="h6">{data.attendance.checkInsLate?.length || 0}</Typography>
                                            </Stack>
                                            <Stack spacing={2} direction={'row'}>
                                                <Typography color='error' variant="h6">{t('misc_checked_out_early')}:</Typography>
                                                <Typography color='error' variant="h6">{data.attendance.checkOutsEarly?.length || 0}</Typography>
                                            </Stack>
                                            <Divider />
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12 }}>
                                                    <Stack spacing={2}>
                                                        <Typography variant="h6">{t('misc_checked_in_late_by_employee')}: {data.attendance.checkInsLateByEmployee?.length || 0}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Stack spacing={2}>
                                                        <Typography variant="h6">{t('misc_checked_out_early_by_employee')}: {data.attendance.checkOutsEarlyByEmployee?.length || 0}</Typography>
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Divider />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography variant="h6" gutterBottom>{t('misc_attendances')}</Typography>
                                                    <TableContainer component={Paper}>
                                                        <Table>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>{t('misc_name')}</TableCell>
                                                                    <TableCell>{t('misc_working_hour')}</TableCell>
                                                                    <TableCell>{t('misc_check_in')}</TableCell>
                                                                    <TableCell>{t('misc_check_out')}</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {data.employees.length > 0 ? data.employees.map((employee) => {
                                                                    const attendance = data.attendances.find((att) => att.employeeId === employee._id);
                                                                    const isCheckInLate = attendance ? data.attendance.checkInsLate?.includes(attendance._id) : '';
                                                                    const isCheckOutEarly = attendance ? data.attendance.checkOutsEarly?.includes(attendance._id) : '';
                                                                    return (
                                                                        <TableRow key={employee._id}>
                                                                            <TableCell><Link component={RouterLink} target='_blank' to={`/employee/${employee._id}`} variant='h6'>{employee ? employee.name : attendance?.employeeId}</Link></TableCell>
                                                                            <TableCell><Typography variant='h6'>{attendance?.workingHour && attendance?.workingHour.isAvailable ? `${attendance.workingHour.start} - ${attendance.workingHour.end}` : '-'}</Typography></TableCell>
                                                                            <TableCell><Typography variant='h6' color={isCheckInLate || !attendance?.checkInTime ? 'error' : 'success'}>{attendance?.checkInTime ? dayjs(attendance.checkInTime).format('HH:mm:ss') : '-'}{isCheckInLate && ` - ${t('misc_late')}`}</Typography></TableCell>
                                                                            <TableCell><Typography variant='h6' color={isCheckOutEarly || !attendance?.checkOutTime ? 'error' : 'success'}>{attendance?.checkOutTime ? dayjs(attendance.checkOutTime).format('HH:mm:ss') : '-'}{isCheckOutEarly && ` - ${t('misc_early')}`}</Typography></TableCell>
                                                                        </TableRow>
                                                                    );
                                                                }) : <TableRow><TableCell colSpan={3} align='center'>{t('srv_attendance_not_found')}</TableCell></TableRow>}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    ) : <Typography>{t('srv_attendance_not_found')}</Typography>
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
