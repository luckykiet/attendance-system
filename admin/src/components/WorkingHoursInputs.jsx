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
    const { watch, control, handleSubmit } = useFormContext();
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
                                                field.onChange(date.format(TIME_FORMAT));
                                            }}
                                            label={t('msg_from')}
                                            maxTime={dayjs(
                                                watch(`workingHours[${key}].end`),
                                                TIME_FORMAT
                                            )}
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
                                                field.onChange(date.format(TIME_FORMAT));
                                            }}
                                            label={t('msg_to')}
                                            minTime={dayjs(
                                                watch(`workingHours[${key}].start`),
                                                TIME_FORMAT
                                            )}
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
                </Grid2>
            </Grid2>
        ))
    );
}
