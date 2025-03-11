import { Controller, useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid2,
    Switch,
    Typography,
} from '@mui/material';
import { daysOfWeeksTranslations, TIME_FORMAT } from '@/utils';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import _ from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import useTranslation from '@/hooks/useTranslation';

dayjs.extend(customParseFormat);

export default function WorkingHoursInputs() {
    const { watch, control, handleSubmit, setValue } = useFormContext();
    const { t } = useTranslation();

    return (
        !_.isEmpty(watch('workingHours')) &&
        Object.keys(watch('workingHours')).map((key) => (
            <Grid2 size={{ xs: 12 }} key={key}>
                <Grid2 container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }}>
                    <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {t(daysOfWeeksTranslations[key].name)}
                        </Typography>
                        <Controller
                            name={`workingHours[${key}].isAvailable`}
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
                                                id={`switch-workingHours[${key}]-isAvailable`}
                                            />
                                        }
                                    />
                                </FormGroup>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name={`workingHours[${key}].start`}
                            control={control}
                            render={({ field, fieldState }) => (
                                <FormControl fullWidth>
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                        <TimePicker
                                            {...field}
                                            value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                            onChange={(date) => {
                                                const formattedDate = date.format(TIME_FORMAT);
                                                const endTime = dayjs(watch(`workingHours[${key}].end`), TIME_FORMAT);
                                                const isOverNight = date.isAfter(endTime);

                                                setValue(`workingHours[${key}].isOverNight`, isOverNight);
                                                field.onChange(formattedDate);
                                            }}
                                            label={t('msg_from')}
                                            id={`picker-${key}-start`}
                                            format={TIME_FORMAT}
                                            disabled={!watch(`workingHours[${key}].isAvailable`)}
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
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name={`workingHours[${key}].end`}
                            control={control}
                            render={({ field, fieldState }) => (
                                <FormControl fullWidth>
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                        <TimePicker
                                            {...field}
                                            value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                            onChange={(date) => {
                                                const formattedDate = date.format(TIME_FORMAT);
                                                const startTime = dayjs(watch(`workingHours[${key}].start`), TIME_FORMAT);
                                                const isOverNight = startTime.isAfter(date);

                                                setValue(`workingHours[${key}].isOverNight`, isOverNight);
                                                field.onChange(formattedDate);
                                            }}
                                            label={t('msg_to')}
                                            id={`picker-${key}-end`}
                                            format={TIME_FORMAT}
                                            disabled={!watch(`workingHours[${key}].isAvailable`)}
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
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{ xs: 6 }}>
                                <Controller
                                    name={`workingHours[${key}].isOverNight`}
                                    control={control}
                                    render={({ field }) =>
                                        field.value ? (
                                            <Typography variant="body1" color="warning">
                                                {t('misc_over_night')}
                                            </Typography>
                                        ) : null
                                    }
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 6 }}>
                                <Typography variant="body1">
                                    {t('misc_duration')}:{' '}
                                    {(() => {
                                        const startTime = dayjs(watch(`workingHours[${key}].start`), TIME_FORMAT);
                                        const endTime = dayjs(watch(`workingHours[${key}].end`), TIME_FORMAT);
                                        let duration;

                                        if (startTime.isValid() && endTime.isValid()) {
                                            if (startTime.isAfter(endTime)) {
                                                duration = dayjs.duration(endTime.add(1, 'day').diff(startTime));
                                            } else {
                                                duration = dayjs.duration(endTime.diff(startTime));
                                            }

                                            const hours = Math.floor(duration.asHours());
                                            const minutes = duration.minutes();
                                            return `${hours}h ${minutes}m`;
                                        }
                                        return '-';
                                    })()}
                                </Typography>
                            </Grid2>
                        </Grid2>
                    </Grid2>
                </Grid2>
            </Grid2>
        ))
    );
}
