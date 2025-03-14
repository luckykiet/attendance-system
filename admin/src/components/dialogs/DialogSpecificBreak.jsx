import { Controller, useForm, FormProvider } from 'react-hook-form';
import {
    Grid2,
    Typography,
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
import { daysOfWeeksTranslations, generateDefaultSpecificBreak, hourToMinutes, minutesToHour, TIME_FORMAT } from '@/utils';
import { useEffect } from 'react';
import _ from 'lodash';
import FeedbackMessage from '../FeedbackMessage';
import { SpecificBreakSchemaWithWorkingHours } from '@/schemas/specific-break';
import { useSpecificBreaksObject } from '@/configs';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const DialogSpecificBreak = ({
    field, open, onClose, onSave,
    workingHours = {
        start: '00:00',
        end: '23:59',
        isOverNight: false,
        isAvailable: true,
    }
}) => {
    const SPECIFIC_BREAKS_OBJ = useSpecificBreaksObject();
    const { t } = useTranslation();

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(SpecificBreakSchemaWithWorkingHours),
        defaultValues: generateDefaultSpecificBreak(),
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = mainForm;


    useEffect(() => {
        const defaultValues = field
            ? { ...field, workingHours }
            : { ...generateDefaultSpecificBreak(), workingHours };

        const currentValues = mainForm.getValues();

        if (!_.isEqual(defaultValues, currentValues)) {
            reset(defaultValues);
        }
    }, [field, mainForm, reset, workingHours]);


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
                        <Grid2 container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }}>
                            <Grid2 size={{ xs: 12 }}>
                                <Typography variant="h6">{field?.type ? t(SPECIFIC_BREAKS_OBJ[field.type]?.name || 'misc_break') : t('misc_break')}</Typography>
                            </Grid2>

                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="start"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    {...field}
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => field.onChange(date.format(TIME_FORMAT))}
                                                    label={t('msg_from')}
                                                    format={TIME_FORMAT}
                                                    views={['hours', 'minutes']}
                                                />
                                            </LocalizationProvider>
                                            {fieldState.error && <FormHelperText>{t(fieldState.error.message)}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid2>

                            <Grid2 size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="end"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <FormControl fullWidth error={fieldState.invalid}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                                                <TimePicker
                                                    {...field}
                                                    value={field.value ? dayjs(field.value, TIME_FORMAT) : null}
                                                    onChange={(date) => field.onChange(date.format(TIME_FORMAT))}
                                                    label={t('msg_to')}
                                                    format={TIME_FORMAT}
                                                    views={['hours', 'minutes']}
                                                />
                                            </LocalizationProvider>
                                            {fieldState.error && <FormHelperText error>{t(fieldState.error.message)}</FormHelperText>}
                                        </FormControl>
                                    )}
                                />
                            </Grid2>

                            <Grid2 size={{ xs: 12 }}>
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
                            </Grid2>
                        </Grid2>
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

DialogSpecificBreak.propTypes = {
    title: PropTypes.node,
    field: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    workingHours: PropTypes.object,
};