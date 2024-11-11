import { Controller, useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid2,
    Switch,
    Typography,
} from '@mui/material';
import { capitalizeFirstLetterOfString, daysOfWeeksTranslations, TIME_FORMAT } from '@/utils';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import _ from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

dayjs.extend(customParseFormat);

export default function OpeningHoursInputs() {
    const { watch, control, handleSubmit } = useFormContext();
    const { t } = useTranslation();

    return (
        !_.isEmpty(watch('openingHours')) &&
        Object.keys(watch('openingHours')).map((key) => (
            <Grid2 size={{ xs: 12 }} key={key}>
                <Grid2 container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }}>
                    <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">
                            {capitalizeFirstLetterOfString(
                                t(daysOfWeeksTranslations[key].name)
                            )}
                        </Typography>
                        <Controller
                            name={`openingHours[${key}].isOpen`}
                            control={control}
                            render={({ field: { ref, ...field } }) => (
                                <FormGroup>
                                    <FormControlLabel
                                        inputRef={ref}
                                        label={t('msg_is_active')}
                                        labelPlacement="start"
                                        control={
                                            <Switch
                                                size="large"
                                                checked={field.value}
                                                {...field}
                                                color="success"
                                                onBlur={handleSubmit}
                                                id={`switch-openingHours[${key}]-isOpen`}
                                            />
                                        }
                                    />
                                </FormGroup>
                            )}
                        />
                    </Grid2>
                    <Grid2 size={{ xs: 6 }}>
                        <Controller
                            name={`openingHours[${key}].open`}
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
                                                watch(`openingHours[${key}].close`),
                                                TIME_FORMAT
                                            )}
                                            id={`picker-${key}-start`}
                                            format={TIME_FORMAT}
                                            disabled={!watch(`openingHours[${key}].isOpen`)}
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
                            name={`openingHours[${key}].close`}
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
                                                watch(`openingHours[${key}].open`),
                                                TIME_FORMAT
                                            )}
                                            id={`picker-${key}-end`}
                                            format={TIME_FORMAT}
                                            disabled={!watch(`openingHours[${key}].isOpen`)}
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
