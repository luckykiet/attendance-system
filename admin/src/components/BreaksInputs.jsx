import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import {
    Grid2,
    IconButton,
    TextField,
    Typography,
    Slider,
    Box,
    Stack,
    Paper,
    FormControl,
    FormLabel,
    FormHelperText,
} from '@mui/material';
import { daysOfWeeksTranslations, hourToMinutes, minutesToHour, TIME_FORMAT } from '@/utils';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import _ from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import useTranslation from '@/hooks/useTranslation';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PropTypes from 'prop-types';
import CustomPopover from './CustomPopover';

dayjs.extend(customParseFormat);

const DayField = ({ day }) => {
    const { t } = useTranslation();
    const { watch, control, setValue } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: `breaks.${day}`,
    });

    return <Grid2 container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }} key={day}>
        <Grid2 size={{ xs: 12 }}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
            <Stack direction="row" spacing={1}>
                <Stack spacing={1}>
                    <Typography variant="h6">
                        {t(daysOfWeeksTranslations[day].name)}
                    </Typography>
                    {!watch(`workingHours.${day}.isAvailable`) ? <Typography variant="body1" color='error'>{t('misc_closed')}</Typography> : <Typography variant="body1">{watch('workingHours')[day].start} - {watch('workingHours')[day].end}</Typography>}
                </Stack>

                <CustomPopover
                    content={<Stack spacing={1}>
                        <Typography variant="body2">{t('msg_break_info')}</Typography>
                    </Stack>}
                />
            </Stack>
            <IconButton
                color="primary"
                onClick={() => append({ start: watch(`workingHours.${day}.start`) || '11:00', end: watch(`workingHours.${day}.end`) || '13:00', name: 'Lunch', duration: 60, isOverNight: false })}
            >
                <AddCircleIcon />
            </IconButton>
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
            <Stack spacing={2}>
                {fields.map((field, index) => {
                    return <Box component={Paper} sx={{ paddingX: 2, paddingY: 4 }} key={field.id}>
                        <Grid2 container spacing={2} >
                            <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">{t('misc_break')} {index + 1}</Typography>
                                <IconButton color="error" onClick={() => remove(index)}>
                                    <DeleteForeverIcon />
                                </IconButton>
                            </Grid2>
                            <Grid2 size={{ xs: 12 }}>
                                <Controller
                                    name={`breaks.${day}[${index}].name`}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('misc_name')}
                                            required
                                            fullWidth
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                                    <Stack direction="row" spacing={1}>
                                        <Typography variant="h6">{t('misc_maturity_period')}</Typography>
                                        <CustomPopover
                                            content={<Stack spacing={1}>
                                                <Typography variant="body2">{t('msg_maturity_period_info')}.</Typography>
                                            </Stack>}
                                        />
                                    </Stack>
                                </Box>
                            </Grid2>
                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name={`breaks.${day}[${index}].start`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    {...field}
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => {
                                                        const formattedDate = date.format(TIME_FORMAT);
                                                        const endTime = dayjs(watch(`breaks.${day}[${index}].end`), TIME_FORMAT);
                                                        const isOverNight = date.isAfter(endTime);

                                                        setValue(`breaks.${day}[${index}].isOverNight`, isOverNight);
                                                        field.onChange(formattedDate);
                                                    }}
                                                    label={t('msg_from')}
                                                    id={`picker-${day}-${index}-break-start`}
                                                    format={TIME_FORMAT}
                                                    views={['hours', 'minutes']}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            variant: 'outlined',
                                                        },
                                                    }}
                                                />
                                            </LocalizationProvider>
                                            {fieldState.error && (
                                                <FormHelperText>{t(fieldState.error.message)}</FormHelperText>
                                            )}
                                        </FormControl>
                                    )}
                                />
                            </Grid2>

                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name={`breaks.${day}[${index}].end`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    {...field}
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => {
                                                        const formattedDate = date.format(TIME_FORMAT);
                                                        const startTime = dayjs(watch(`breaks.${day}[${index}].start`), TIME_FORMAT);
                                                        const isOverNight = startTime.isAfter(date);

                                                        setValue(`breaks.${day}[${index}].isOverNight`, isOverNight);
                                                        field.onChange(formattedDate);
                                                    }}
                                                    label={t('msg_to')}
                                                    id={`picker-${day}-${index}-break-end`}
                                                    format={TIME_FORMAT}
                                                    views={['hours', 'minutes']}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            variant: 'outlined',
                                                        },
                                                    }}
                                                />
                                            </LocalizationProvider>
                                            {fieldState.error && (
                                                <FormHelperText>{t(fieldState.error.message)}</FormHelperText>
                                            )}
                                        </FormControl>
                                    )}
                                />
                            </Grid2>


                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name={`breaks.${day}[${index}].isOverNight`}
                                    control={control}
                                    render={({ field }) =>
                                        field.value ? (
                                            <Typography color="warning.main">{t('misc_over_night')}</Typography>
                                        ) : null
                                    }
                                />
                            </Grid2>

                            <Grid2 size={{ xs: 12 }}>
                                <Controller
                                    name={`breaks.${day}[${index}].duration`}
                                    control={control}
                                    render={({ field, fieldState }) => {
                                        // Convert the stored minutes to hours for display
                                        const displayValue = minutesToHour(field.value);

                                        return (
                                            <FormControl fullWidth error={fieldState.invalid}>
                                                <FormLabel id="duration-break-slider">{t('misc_duration')}</FormLabel>
                                                <Box sx={{ paddingX: 2 }}>
                                                    <Slider
                                                        value={displayValue}
                                                        onChange={(_, value) => field.onChange(hourToMinutes(value))}
                                                        min={0.25}
                                                        max={24}
                                                        step={0.25}
                                                        marks
                                                        valueLabelDisplay="auto"
                                                        aria-labelledby="duration-break-slider"
                                                    />
                                                </Box>
                                                {fieldState.error && (
                                                    <FormHelperText>{t(fieldState.error.message)}</FormHelperText>
                                                )}
                                                {field.value > 0 && !isNaN(field.value) && (
                                                    <FormHelperText>
                                                        {t('misc_duration')}:{" "}
                                                        {Math.floor(displayValue) > 0 && (
                                                            <>
                                                                {Math.floor(displayValue)} {t('misc_hour_short')}{" "}
                                                            </>
                                                        )}
                                                        {(displayValue % 1) * 60 > 0 && (
                                                            <>
                                                                {Math.round((displayValue % 1) * 60)} {t('misc_min_short')}
                                                            </>
                                                        )}
                                                    </FormHelperText>
                                                )}
                                            </FormControl>
                                        );
                                    }}
                                />
                            </Grid2>

                        </Grid2>
                    </Box>
                })}
            </Stack>
        </Grid2>
    </Grid2>
}

DayField.propTypes = {
    day: PropTypes.string.isRequired,
};

const BreaksInputs = () => {
    const { watch } = useFormContext();

    return (
        !_.isEmpty(watch('breaks')) &&
        Object.keys(watch('breaks')).map((day) => {
            return (
                <DayField key={day} day={day} />
            );
        }));
}

export default BreaksInputs;
