import { Controller, useForm, FormProvider } from 'react-hook-form';
import {
    Grid,
    Typography,
    TextField,
    Box,
    Stack,
    FormControl,
    FormHelperText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
    FormLabel,
    Button,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import useTranslation from '@/hooks/useTranslation';
import CustomPopover from '@/components/CustomPopover';
import PropTypes from 'prop-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { daysOfWeeksTranslations, generateDefaultBreak, hourToMinutes, isOverNight, minutesToHour, TIME_FORMAT } from '@/utils';
import { useEffect } from 'react';
import _ from 'lodash';
import FeedbackMessage from '../FeedbackMessage';
import { BreakSchemaWithWorkingHours } from '@/schemas/break';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const DialogBreak = ({
    field, open, onClose, onSave,
    workingHours = {
        start: '00:00',
        end: '23:59',
        isOverNight: false,
        isAvailable: true,
    }
}) => {
    const { t } = useTranslation();

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(BreakSchemaWithWorkingHours),
        defaultValues: generateDefaultBreak(),
    });

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = mainForm;


    useEffect(() => {
        const defaultValues = field
            ? { ...field, workingHours }
            : { ...generateDefaultBreak(), workingHours };

        const currentValues = mainForm.getValues();

        if (!_.isEqual(defaultValues, currentValues)) {
            reset(defaultValues);
        }
    }, [field, mainForm, reset, workingHours]);
    
    const start = watch('start');
    const end = watch('end');

    useEffect(() => {
        if (start && end) {
            const newIsOverNight = isOverNight(start, end);
            setValue('isOverNight', newIsOverNight);
        }
    }, [end, setValue, start])

    const onSubmit = (data) => {
        onSave(data);
    };

    return (
        <FormProvider {...mainForm}>
            <Dialog maxWidth={'md'} open={open} onClose={onClose}>
                <DialogTitle>
                    <Stack direction="row" spacing={1}>
                        <Typography variant="h6">{t('misc_break')}:</Typography>
                        {field?.day ? <Typography variant="h6"> {t(daysOfWeeksTranslations[field.day]?.name)}</Typography> : <Typography variant="h6">{t('misc_new')}</Typography>}
                        <Typography variant="h6">{workingHours.start} - {workingHours.end}</Typography>
                        {workingHours.isOverNight ? <Typography variant='h6' color='warning'>({t('misc_over_night')})</Typography> : null}
                        <CustomPopover
                            content={<Typography variant="body2">{t('msg_break_info')}</Typography>}
                        />
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <form id="break-form" onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth>
                                            <TextField {...field} label={t('misc_name')} required fullWidth variant="outlined" />
                                            {fieldState.error && <FormHelperText error>{t(fieldState.error.message)}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="start"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    {...field}
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => {
                                                        const formattedDate = date.format(TIME_FORMAT);
                                                        field.onChange(formattedDate);
                                                    }}
                                                    label={t('msg_from')}
                                                    format={TIME_FORMAT}
                                                    views={['hours', 'minutes']}
                                                />
                                            </LocalizationProvider>
                                            {fieldState.error && <FormHelperText>{t(fieldState.error.message)}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="end"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    {...field}
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => {
                                                        const formattedDate = date.format(TIME_FORMAT);
                                                        field.onChange(formattedDate);
                                                    }}
                                                    label={t('msg_to')}
                                                    format={TIME_FORMAT}
                                                    views={['hours', 'minutes']}
                                                />
                                            </LocalizationProvider>
                                            {fieldState.error && <FormHelperText error>{t(fieldState.error.message)}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="duration"
                                    control={control}
                                    render={({ field, fieldState }) => {
                                        const displayValue = minutesToHour(field.value);

                                        return (
                                            <FormControl fullWidth error={fieldState.invalid}>
                                                <FormLabel>{t('misc_duration')}</FormLabel>
                                                <Box sx={{ paddingX: 2 }}>
                                                    <Slider
                                                        value={minutesToHour(field.value)}
                                                        onChange={(_, value) => field.onChange(hourToMinutes(value))}
                                                        min={0.25}
                                                        max={24}
                                                        step={0.25}
                                                        marks
                                                        valueLabelDisplay="auto"
                                                    />
                                                </Box>
                                                {fieldState.error && <FormHelperText error>{t(fieldState.error.message)}</FormHelperText>}
                                                <Stack direction="row" spacing={1} width={'100%'} justifyContent="center">
                                                    <Typography variant="body1">{Math.floor(displayValue) > 0 && (
                                                        <>
                                                            {Math.floor(displayValue)} {t('misc_hour_short')}{" "}
                                                        </>
                                                    )}
                                                        {(displayValue % 1) * 60 > 0 && (
                                                            <>
                                                                {Math.round((displayValue % 1) * 60)} {t('misc_min_short')}
                                                            </>
                                                        )}</Typography>
                                                </Stack>
                                            </FormControl>
                                        );
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
                <DialogActions>
                    <Stack direction="row" paddingX={4} spacing={1} width={'100%'} justifyContent={!_.isEmpty(errors) ? 'space-between' : 'flex-end'} alignItems={'center'}>
                        {!_.isEmpty(errors) && <FeedbackMessage message={new Error(t('msg_control_typed_field'))} />}
                        <Stack direction="row" spacing={1}>
                            <Button variant='outlined' color='error' onClick={onClose}>{t('misc_cancel')}</Button>
                            <Button type="submit" form="break-form" variant="contained">{t('misc_save')}</Button>
                        </Stack>
                    </Stack>
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

DialogBreak.propTypes = {
    title: PropTypes.node,
    field: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    workingHours: PropTypes.object,
};