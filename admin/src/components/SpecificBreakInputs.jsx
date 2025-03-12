import { Controller, useFormContext } from 'react-hook-form';
import {
    Grid2,
    Typography,
    Slider,
    Box,
    Stack,
    Paper,
    FormControl,
    FormLabel,
    FormHelperText,
    FormGroup,
    FormControlLabel,
    Switch,
    Button,
} from '@mui/material';
import { daysOfWeeksTranslations, hourToMinutes, minutesToHour, renderIcon, TIME_FORMAT } from '@/utils';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import _ from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import useTranslation from '@/hooks/useTranslation';
import PropTypes from 'prop-types';
import CustomPopover from './CustomPopover';
import { useSpecificBreaks } from '@/configs';
import { useState } from 'react';

dayjs.extend(customParseFormat);

const ApplyButton = ({ specificBreak, type }) => {
    const { t } = useTranslation();
    const { watch, setValue } = useFormContext();
    const [isApplied, setIsApplied] = useState(false);

    const applyToAllDays = () => {
        setIsApplied(false);
        const specificBreaks = watch('specificBreaks');

        const updated = Object.entries(specificBreaks).reduce((acc, [day, breaks]) => {
            acc[day] = {
                ...breaks,
                [type]: specificBreak,
            };
            return acc;
        }, {});

        setValue('specificBreaks', updated);
        setIsApplied(true);
    };

    return (
        <Stack direction="row" spacing={2} display={'flex'} alignItems={'center'}>
            <Button variant="contained" color="primary" onClick={applyToAllDays}>
                {t('misc_apply_for_all_days')}
            </Button>
            {isApplied && <Typography variant="body2" color="success">
                {t('msg_applied_changes')}
            </Typography>}
        </Stack>
    );
};


ApplyButton.propTypes = {
    specificBreak: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
};

const DayField = ({ day }) => {
    const { t } = useTranslation();
    const { watch, control, setValue, handleSubmit } = useFormContext();
    const SPECIFIC_BREAKS_ARRAY = useSpecificBreaks();

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
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
            <Stack spacing={2}>
                {SPECIFIC_BREAKS_ARRAY.map((brk) => {
                    const specificBreakKey = `specificBreaks.${day}.${brk.key}`;
                    return <Box component={Paper} sx={{ paddingX: 2, paddingY: 4 }} key={brk.key}>
                        <Grid2 container spacing={2} >
                            <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={1} display={'flex'} alignItems={'center'}>
                                    <Typography variant="h6">{t(brk.name)}</Typography>
                                    {renderIcon(brk.icon)}
                                </Stack>
                                <Controller
                                    name={`${specificBreakKey}.isAvailable`}
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
                                                        id={`switch-specific-break-${day}-${brk.key}-isAvailable`}
                                                    />
                                                }
                                            />
                                        </FormGroup>
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
                                    name={`${specificBreakKey}.start`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => {
                                                        if (!date || !date.isValid()) {
                                                            field.onChange(null);
                                                            return;
                                                        }

                                                        const formattedDate = date.format(TIME_FORMAT);
                                                        const endTime = dayjs(watch(`${specificBreakKey}.end`), TIME_FORMAT);
                                                        const isOverNight = date.isAfter(endTime);

                                                        setValue(`${specificBreakKey}.isOverNight`, isOverNight);
                                                        field.onChange(formattedDate);
                                                    }}
                                                    onBlur={field.onBlur}
                                                    label={t('msg_from')}
                                                    id={`picker-${day}-${brk.key}-specific-break-start`}
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
                                    name={`${specificBreakKey}.end`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => {
                                                        if (!date || !date.isValid()) {
                                                            field.onChange(null);
                                                            return;
                                                        }

                                                        const formattedDate = date.format(TIME_FORMAT);
                                                        const startTime = dayjs(watch(`${specificBreakKey}.start`), TIME_FORMAT);
                                                        const isOverNight = startTime.isAfter(date);

                                                        setValue(`${specificBreakKey}.isOverNight`, isOverNight);
                                                        field.onChange(formattedDate);
                                                    }}
                                                    onBlur={field.onBlur}
                                                    label={t('msg_to')}
                                                    id={`picker-${day}-${brk.key}-specific-break-end`}
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
                                    name={`${specificBreakKey}.isOverNight`}
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
                                    name={`${specificBreakKey}.duration`}
                                    control={control}
                                    render={({ field, fieldState }) => {
                                        const displayValue = minutesToHour(field.value);

                                        return (
                                            <FormControl fullWidth error={fieldState.invalid}>
                                                <FormLabel id="duration-specific-break-slider">{t('misc_duration')}</FormLabel>
                                                <Box sx={{ paddingX: 2 }}>
                                                    <Slider
                                                        value={displayValue}
                                                        onChange={(_, value) => field.onChange(hourToMinutes(value))}
                                                        min={0.25}
                                                        max={24}
                                                        step={0.25}
                                                        marks
                                                        valueLabelDisplay="auto"
                                                        aria-labelledby="duration-specific-break-slider"
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
                            <Grid2 size={{ xs: 12 }}>
                                <ApplyButton specificBreak={watch(`${specificBreakKey}`)} type={brk.key} />
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

const SpecificBreakInputs = () => {
    const { watch } = useFormContext();
    return (
        !_.isEmpty(watch('specificBreaks')) &&
        Object.keys(watch('specificBreaks')).map((day) => {
            return (
                <DayField key={day} day={day} />
            );
        }));
}

export default SpecificBreakInputs;
