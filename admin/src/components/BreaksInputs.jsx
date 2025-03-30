import { useFieldArray, useFormContext } from 'react-hook-form';
import {
    Grid,
    IconButton,
    Typography,
    Box,
    Stack,
    Paper,
} from '@mui/material';
import { daysOfWeeksTranslations, minutesToHour } from '@/utils';
import _ from 'lodash';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import useTranslation from '@/hooks/useTranslation';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PropTypes from 'prop-types';
import CustomPopover from './CustomPopover';
import { DialogBreak } from '@/components/dialogs/DialogBreak';
import { Edit } from '@mui/icons-material';
import { useOpen, useSelectedBreak, useSelectedBreakKey, useSetOpen, useSetSelectedBreak, useSetSelectedBreakKey } from '@/stores/break';

dayjs.extend(customParseFormat);

const DayField = ({ day }) => {
    const { t } = useTranslation();
    const { watch, control, getFieldState } = useFormContext();
    const setSelectedBreakKey = useSetSelectedBreakKey();
    const setSelectedBreak = useSetSelectedBreak();
    const setOpen = useSetOpen();

    const { fields, append, remove } = useFieldArray({
        control,
        name: `breaks.${day}`,
    });

    return <Grid container spacing={2} sx={{ px: 2, pt: 3, pb: 1 }}>
        <Grid size={{ xs: 12 }}
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
            <IconButton
                color="primary"
                onClick={() => append({ start: watch(`workingHours.${day}.start`) || '11:00', end: watch(`workingHours.${day}.end`) || '13:00', name: 'Break', duration: 60, isOverNight: false })}
            >
                <AddCircleIcon />
            </IconButton>
        </Grid>
        <Grid size={{ xs: 12 }}>
            <Stack spacing={2}>
                {fields.map((field, index) => {
                    const key = `breaks.${day}[${index}]`;
                    const displayValue = minutesToHour(watch(`${key}.duration`));
                    const brk = watch(key);
                    const error = getFieldState(key)?.error || {};

                    return <Box component={Paper} sx={{ paddingX: 2, paddingY: 4 }} key={field.id}>
                        <Grid container spacing={1} >
                            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="h6">{t('misc_name')}{":"}</Typography>
                                    <Typography variant="h6">{brk.name}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <IconButton onClick={() => {
                                        setSelectedBreakKey(key);
                                        setSelectedBreak({ ...brk, day });
                                        setOpen(true);
                                    }}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => remove(index)}>
                                        <DeleteForeverIcon />
                                    </IconButton>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1}>
                                        <Typography variant="body1">{t('misc_maturity_period')}</Typography>
                                        <Typography variant="body1">{brk.start} - {brk.end}</Typography>
                                        <CustomPopover
                                            content={<Stack spacing={1}>
                                                <Typography variant="body2">{t('msg_maturity_period_info')}.</Typography>
                                            </Stack>}
                                        />
                                    </Stack>
                                    {!_.isEmpty(error) && Object.keys(error).map((field) => {
                                        return <Typography key={field} color="error">{t(error[field].message)}</Typography>
                                    })}
                                    {brk.isOverNight && <Typography color="warning.main">{t('misc_over_night')}</Typography>}
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
                            </Grid>
                        </Grid>
                    </Box>
                })}
            </Stack>
        </Grid>
    </Grid>
}

DayField.propTypes = {
    day: PropTypes.string.isRequired,
};

const BreaksInputs = () => {
    const { watch, setValue } = useFormContext();
    const [selectedBreakKey, setSelectedBreakKey] = [useSelectedBreakKey(), useSetSelectedBreakKey()];
    const [selectedBreak, setSelectedBreak] = [useSelectedBreak(), useSetSelectedBreak()];
    const [open, setOpen] = [useOpen(), useSetOpen()];

    const onClose = () => {
        setOpen(false);
        setSelectedBreakKey('')
        setSelectedBreak(null);
    };

    const onSave = async (data) => {
        if (!selectedBreakKey) return;
        setValue(selectedBreakKey, data);
        onClose();
    }

    const breaks = watch('breaks');

    return (
        <>
            {!_.isEmpty(breaks) && Object.keys(breaks).map((day) => <DayField key={day} day={day} />)}
            <DialogBreak field={selectedBreak} open={open} onClose={onClose} onSave={onSave} workingHours={selectedBreak?.day ? watch(`workingHours.${selectedBreak.day}`) : undefined} />
        </>
    )
}

export default BreaksInputs;
