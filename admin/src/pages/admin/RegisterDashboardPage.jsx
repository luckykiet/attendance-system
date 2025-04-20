import { fetchRegister } from '@/api/register'
import LoadingCircle from '@/components/LoadingCircle'
import useTranslation from '@/hooks/useTranslation'
import DashboardSchema from '@/schemas/dashboard'
import { DATE_FORMAT } from '@/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Container, FormControl, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, Button } from '@mui/material'
import { Stack } from '@mui/system'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchRegisterAggregation } from '@/api/aggregation'
import { useEffect, useState, useCallback } from 'react'
import { debounce } from 'lodash'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CSVLink } from 'react-csv';

const RegisterDashboardPage = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { registerId } = useParams()
    const now = dayjs()

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(DashboardSchema),
        defaultValues: {
            start: now.startOf('month').format(DATE_FORMAT),
            end: now.isSame(now.endOf('month'), 'day') ? now.endOf('month').format(DATE_FORMAT) : now.format(DATE_FORMAT),
        },
    });

    const { control, handleSubmit, setValue, watch } = mainForm

    const start = watch('start')
    const end = watch('end')

    const [validatedDates, setValidatedDates] = useState(null)

    const registerQuery = useQuery({
        queryKey: ['register', registerId],
        queryFn: () => fetchRegister(registerId),
        enabled: !!registerId,
    })

    const aggregationQuery = useQuery({
        queryKey: ['aggregation', registerId, validatedDates?.start, validatedDates?.end],
        queryFn: () => fetchRegisterAggregation({
            registerId,
            start: validatedDates.start,
            end: validatedDates.end,
        }),
        enabled: !!registerId && !!validatedDates?.start && !!validatedDates?.end,
    })

    const { data: register, isLoading: isRegisterLoading, isFetching: isRegisterFetching } = registerQuery
    const { data: aggregation, isLoading: isAggregationLoading, isFetching: isAggregationFetching } = aggregationQuery

    const onSubmit = useCallback((values) => {
        setValidatedDates({
            start: values.start,
            end: values.end,
        })
    }, [])

    useEffect(() => {
        const debouncedSubmit = debounce(() => {
            handleSubmit(onSubmit)()
        }, 300)

        if (registerId && start && end) {
            debouncedSubmit()
        }
    }, [registerId, start, end, handleSubmit, onSubmit])

    const csvData = aggregation?.employees?.map((employee) => {
        const actualMinutes = aggregation.workingHoursByEmployee?.[employee._id] || 0;
        const expectedMinutes = aggregation.expectedWorkingHoursByEmployee?.[employee._id] || 0;
        const actualShiftAmount = aggregation.actualShiftsAmountByEmployee?.[employee._id] || 0;
        const expectedShiftAmount = aggregation.expectedShiftsAmountByEmployee?.[employee._id] || 0;

        return {
            name: employee.name,
            email: employee.email,
            actualShiftAmount,
            expectedShiftAmount,
            actualMinutes,
            expectedMinutes,
        };
    }) || [];

    return (
        <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
            {isRegisterLoading || isRegisterFetching || isAggregationLoading || isAggregationFetching ? (
                <LoadingCircle />
            ) : register ? (
                <Stack spacing={2}>
                    <Typography variant="h4">{t('misc_dashboard')}</Typography>
                    <Stack spacing={1}>
                        <Typography variant="h5">{register.name}</Typography>
                        <Typography variant="body1">{register.address?.street}</Typography>
                        <Typography variant="body1">{register.address?.zip} {register.address?.city}</Typography>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="start"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <FormControl fullWidth>
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                            <DatePicker
                                                {...field}
                                                value={field.value ? dayjs(field.value, DATE_FORMAT) : null}
                                                onChange={(date) => {
                                                    const formattedDate = date?.format(DATE_FORMAT)
                                                    field.onChange(formattedDate)
                                                }}
                                                label={t('msg_from')}
                                                format="DD.MM.YYYY"
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                        error: fieldState.invalid,
                                                        helperText: fieldState.invalid ? t(fieldState.error?.message) : '',
                                                    },
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="end"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <FormControl fullWidth>
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                            <DatePicker
                                                {...field}
                                                value={field.value ? dayjs(field.value, DATE_FORMAT) : null}
                                                onChange={(date) => {
                                                    const formattedDate = date?.format(DATE_FORMAT)
                                                    field.onChange(formattedDate)
                                                }}
                                                label={t('msg_to')}
                                                format="DD.MM.YYYY"
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                        error: fieldState.invalid,
                                                        helperText: fieldState.invalid ? t(fieldState.error?.message) : '',
                                                    },
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const newStart = dayjs(start, DATE_FORMAT).subtract(1, 'month').startOf('month').format(DATE_FORMAT);
                                        const newEnd = dayjs(start, DATE_FORMAT).subtract(1, 'month').endOf('month').format(DATE_FORMAT);
                                        setValue('start', newStart, { shouldValidate: true });
                                        setValue('end', newEnd, { shouldValidate: true });
                                    }}
                                >
                                    ← {t('misc_prev_month')}
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const now = dayjs();
                                        const newStart = now.startOf('month').format(DATE_FORMAT);
                                        const newEnd = now.format(DATE_FORMAT);
                                        setValue('start', newStart, { shouldValidate: true });
                                        setValue('end', newEnd, { shouldValidate: true });
                                    }}
                                >
                                    {t('misc_this_month')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={dayjs(start, DATE_FORMAT).add(1, 'month').startOf('month').isAfter(now)}
                                    onClick={() => {
                                        const nextMonthStart = dayjs(start, DATE_FORMAT).add(1, 'month').startOf('month');
                                        const nextMonthEnd = dayjs(start, DATE_FORMAT).add(1, 'month').endOf('month');
                                        const today = dayjs();

                                        if (nextMonthStart.isAfter(today, 'day')) {
                                            return;
                                        }

                                        const newStart = nextMonthStart.format(DATE_FORMAT);
                                        const newEnd = nextMonthEnd.isAfter(today) ? today.format(DATE_FORMAT) : nextMonthEnd.format(DATE_FORMAT);

                                        setValue('start', newStart, { shouldValidate: true });
                                        setValue('end', newEnd, { shouldValidate: true });
                                    }}
                                >
                                    {t('misc_next_month')} →
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>

                    {aggregation && (
                        <Stack spacing={4} mt={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" mb={2}>{t('misc_summary')}</Typography>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>{t('misc_field')}</TableCell>
                                                    <TableCell align="right">{t('misc_value')}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>{t('misc_total_days')}</TableCell>
                                                    <TableCell align="right">{aggregation.totalDays}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_total_expected_shifts')}</TableCell>
                                                    <TableCell align="right">{aggregation.totalExpectedShifts}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_total_attendances')}</TableCell>
                                                    <TableCell align="right">{aggregation.totalAttendances}</TableCell>
                                                </TableRow>

                                                <TableRow>
                                                    <TableCell>{t('misc_checked_in_on_time')}</TableCell>
                                                    <TableCell align="right">{aggregation.checkedInOnTime}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_checked_in_late')}</TableCell>
                                                    <TableCell align="right">{aggregation.checkedInLate}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_checked_out_on_time')}</TableCell>
                                                    <TableCell align="right">{aggregation.checkedOutOnTime}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_checked_out_early')}</TableCell>
                                                    <TableCell align="right">{aggregation.checkedOutEarly}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_missing_check_in')}</TableCell>
                                                    <TableCell align="right">{aggregation.missingCheckIn}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_missing_check_out')}</TableCell>
                                                    <TableCell align="right">{aggregation.missingCheckOut}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_expected_working_time')}</TableCell>
                                                    <TableCell align="right">{(aggregation.totalExpectedWorkingHours / 60).toFixed(2)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>{t('misc_actual_working_time')}</TableCell>
                                                    <TableCell align="right">{(aggregation.totalWorkingMinutes / 60).toFixed(2)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>

                            {aggregation.employees?.length > 0 && (
                                <Card>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack spacing={2} direction={'row'} justifyContent={'space-between'}>
                                                <Typography variant="h6" mb={2}>{t('misc_working_hours_by_employee')}</Typography>
                                                {csvData.length && <Stack direction="row" justifyContent="flex-end" mb={2}>
                                                    <CSVLink
                                                        data={csvData}
                                                        filename={`attendance-${start.toString()}-${end.toString()}-${registerId}.csv`}
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
                                                            <TableCell>{t('misc_employee')}</TableCell>
                                                            <TableCell align="right">{t('misc_actual_shift_amount')}</TableCell>
                                                            <TableCell align="right">{t('misc_expected_shift_amount')}</TableCell>
                                                            <TableCell align="right">{t('misc_actual_working_time')} ({t('misc_hour').toLowerCase()})</TableCell>
                                                            <TableCell align="right">{t('misc_expected_working_time')} ({t('misc_hour').toLowerCase()})</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {aggregation.employees.map((employee) => {
                                                            const actualMinutes = aggregation.workingHoursByEmployee?.[employee._id] || 0;
                                                            const expectedMinutes = aggregation.expectedWorkingHoursByEmployee?.[employee._id] || 0;
                                                            const actualHours = actualMinutes / 60;
                                                            const expectedHours = expectedMinutes / 60;
                                                            const isLess = actualHours < expectedHours;
                                                            const actualShiftAmount = aggregation.actualShiftsAmountByEmployee?.[employee._id] || 0;
                                                            const expectedShiftAmount = aggregation.expectedShiftsAmountByEmployee?.[employee._id] || 0;
                                                            const isShiftAmountLess = actualShiftAmount < expectedShiftAmount;

                                                            return (
                                                                <TableRow key={employee._id} onClick={() => navigate(`/employee/${employee._id}`)} sx={{ cursor: 'pointer' }}>
                                                                    <TableCell>
                                                                        {employee.name} <br />
                                                                        <Typography variant="caption" color="text.secondary">{employee.email}</Typography>
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Typography color={isShiftAmountLess ? 'error' : 'success.main'}>
                                                                            {actualShiftAmount}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Typography>
                                                                            {expectedShiftAmount}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Typography color={isLess ? 'error' : 'success.main'}>
                                                                            {actualHours.toFixed(2)}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {expectedHours.toFixed(2)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}

                            {aggregation.employees?.length > 0 && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" mb={2}>{t('misc_comparison_actual_expected')}</Typography>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart
                                                data={aggregation.employees.map((employee) => ({
                                                    name: employee.name,
                                                    actual: (aggregation.workingHoursByEmployee?.[employee._id] || 0) / 60,
                                                    expected: (aggregation.expectedWorkingHoursByEmployee?.[employee._id] || 0) / 60,
                                                }))}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis label={{ value: t('misc_hours'), angle: -90, position: 'insideLeft' }} />
                                                <Tooltip formatter={(value) => `${value.toFixed(2)} ${t('misc_hour_short').toLowerCase()}`} />
                                                <Bar dataKey="actual" name={t('misc_actual_working_time')} />
                                                <Bar dataKey="expected" name={t('misc_expected_working_time')} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}

                        </Stack>
                    )}
                </Stack>
            ) : (
                <Typography textAlign="center" variant="h5" color="error">
                    {t('srv_register_not_found')}
                </Typography>
            )}
        </Container>
    )
}

export default RegisterDashboardPage
