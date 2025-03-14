import { Controller, useFormContext } from 'react-hook-form';
import {
    Grid2,
    Typography,
    Box,
    Stack,
    Paper,
    FormGroup,
    FormControlLabel,
    Switch,
    Button,
    IconButton,
} from '@mui/material';
import { daysOfWeeksTranslations, minutesToHour, renderIcon } from '@/utils';
import _ from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import useTranslation from '@/hooks/useTranslation';
import PropTypes from 'prop-types';
import CustomPopover from './CustomPopover';
import { useSpecificBreaks } from '@/configs';
import { useState } from 'react';
import { useOpen, useSelectedSpecificBreak, useSelectedSpecificBreakKey, useSetOpen, useSetSelectedSpecificBreak, useSetSelectedSpecificBreakKey } from '@/stores/specific-break';
import { DialogSpecificBreak } from './dialogs/DialogSpecificBreak';
import { Edit } from '@mui/icons-material';

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
    const { watch, control, handleSubmit, getFieldState } = useFormContext();
    const SPECIFIC_BREAKS_ARRAY = useSpecificBreaks();

    const setOpen = useSetOpen();
    const setSelectedSpecificBreakKey = useSetSelectedSpecificBreakKey();
    const setSelectedSpecificBreak = useSetSelectedSpecificBreak();

    return <Grid2 container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }} key={day}>
        <Grid2 size={{ xs: 12 }}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
            <Stack direction="row" spacing={1}>
                <Stack spacing={1}>
                    <Typography variant="h5">
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
                    const displayValue = minutesToHour(watch(`${specificBreakKey}.duration`));
                    const specificBrk = watch(specificBreakKey);
                    const error = getFieldState(specificBreakKey)?.error || {};

                    return <Box component={Paper} sx={{ paddingX: 2, paddingY: 4 }} key={brk.key}>
                        <Grid2 container spacing={1} >
                            <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={1} display={'flex'} alignItems={'center'}>
                                    <Typography variant="h6">{t(brk.name)}</Typography>
                                    {renderIcon(brk.icon)}
                                </Stack>
                                <Stack direction="row" spacing={1}>
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
                                    <IconButton onClick={() => {
                                        setSelectedSpecificBreakKey(specificBreakKey);
                                        setSelectedSpecificBreak({ ...specificBrk, day, type: brk.key });
                                        setOpen(true);
                                    }}>
                                        <Edit />
                                    </IconButton>
                                </Stack>

                            </Grid2>
                            <Grid2 size={{ xs: 12 }}>

                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1}>
                                        <Typography variant="body1">{t('misc_maturity_period')}</Typography>
                                        <Typography variant="body1">{specificBrk.start} - {specificBrk.end}</Typography>
                                        <CustomPopover
                                            content={<Stack spacing={1}>
                                                <Typography variant="body2">{t('msg_maturity_period_info')}.</Typography>
                                            </Stack>}
                                        />
                                    </Stack>
                                    {!_.isEmpty(error) && Object.keys(error).map((field) => {
                                        return <Typography key={field} color="error">{t(error[field].message)}</Typography>
                                    })}
                                    {specificBrk.isOverNight && <Typography color="warning.main">{t('misc_over_night')}</Typography>}
                                    <Stack direction="row" spacing={1}>
                                        <Typography variant="body1">{t('misc_duration')}:</Typography>
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
                                </Stack>
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
    const { watch, setValue } = useFormContext();
    const [selectedSpecificBreakKey, setSelectedSpecificBreakKey] = [useSelectedSpecificBreakKey(), useSetSelectedSpecificBreakKey()];
    const [selectedSpecificBreak, setSelectedSpecificBreak] = [useSelectedSpecificBreak(), useSetSelectedSpecificBreak()];
    const [open, setOpen] = [useOpen(), useSetOpen()];

    const onClose = () => {
        setOpen(false);
        setSelectedSpecificBreakKey('')
        setSelectedSpecificBreak(null);
    };

    const onSave = async (data) => {
        if (!selectedSpecificBreakKey) return;
        setValue(selectedSpecificBreakKey, data);
        onClose();
    }

    const specificBreaks = watch('specificBreaks');
    return (
        <>
            {!_.isEmpty(specificBreaks) && Object.keys(specificBreaks).map((day) => <DayField key={day} day={day} />)}
            <DialogSpecificBreak field={selectedSpecificBreak} open={open} onClose={onClose} onSave={onSave} workingHours={selectedSpecificBreak?.day ? watch(`workingHours.${selectedSpecificBreak.day}`) : undefined} />
        </>)
}

export default SpecificBreakInputs;
