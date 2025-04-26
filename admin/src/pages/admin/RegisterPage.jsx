import { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    TextField,
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    Typography,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Divider,
    Button
} from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTranslation from '@/hooks/useTranslation';
import { calculateKilometersFromMeters, getDefaultRegister, TIME_FORMAT } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRegister, deleteRegister, fetchRegister, updateRegister } from '@/api/register';
import FeedbackMessage from '@/components/FeedbackMessage';
import { useRetail, useSetAlertMessage } from '@/stores/root';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import OpeningTimeInputs from '@/components/WorkingHoursInputs';
import LocationPicker from '@/components/LocationPicker';
import { useSetConfirmBox } from '@/stores/confirm';
import { ExpandMore } from '@mui/icons-material';
import CopyButton from '@/components/CopyButton';
import { getLocalDevicesByRegisterId } from '@/api/local-devices';
import { deleteLocalDevice } from '@/api/local-device';
import { useConfigStore } from '@/stores/config';
import CustomPopover from '@/components/CustomPopover';
import BreaksInputs from '@/components/BreaksInputs';
import SpecificBreakInputs from '@/components/SpecificBreakInputs';
import _ from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import RegisterSchema from '@/schemas/register';

dayjs.extend(customParseFormat);

export default function RegisterPage() {
    const { registerId } = useParams();
    const { t } = useTranslation();
    const config = useConfigStore();
    const retail = useRetail();
    const [postMsg, setPostMsg] = useState('');
    const setAlertMessage = useSetAlertMessage();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);
    const setConfirmBox = useSetConfirmBox();
    const navigate = useNavigate();

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(RegisterSchema),
        defaultValues: getDefaultRegister(),
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = mainForm;

    const createNewRegisterMutation = useMutation({
        mutationFn: (data) => createRegister(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: 'srv_created', severity: 'success' });
            queryClient.invalidateQueries({ queryKey: ['register'] });
            queryClient.invalidateQueries({ queryKey: ['registers'] });
            navigate(`/register/${data._id}`);
        }
    })

    const updateRegisterMutation = useMutation({
        mutationFn: (data) => updateRegister(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: () => {
            setAlertMessage({ msg: 'srv_updated', severity: 'success' });
            queryClient.invalidateQueries({ queryKey: ['register', registerId] });
            queryClient.invalidateQueries({ queryKey: ['registers'] });
        }
    })

    const deleteRegisterMutation = useMutation({
        mutationFn: () => deleteRegister(registerId),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: data, severity: 'success' });
            queryClient.invalidateQueries(['register']);
        }
    })

    const deleteLocalDeviceMutation = useMutation({
        mutationFn: (id) => deleteLocalDevice(id),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: data, severity: 'success' });
            queryClient.invalidateQueries(['register']);
        }
    })

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptcha = await executeRecaptcha(`${registerId ? 'update' : 'create'}register`);
            const { breaks } = data
            Object.keys(breaks).forEach((day) => {

                const dayBreaks = breaks[day];
                const sortedBreaks = dayBreaks.sort((a, b) => {
                    const startA = dayjs(a.start, TIME_FORMAT, true);
                    const startB = dayjs(b.start, TIME_FORMAT, true);
                    return startA.isBefore(startB) ? -1 : 1;
                });

                data.breaks[day] = sortedBreaks
            })

            if (registerId) {
                updateRegisterMutation.mutate({ ...data, _id: registerId, recaptcha })
            } else {
                createNewRegisterMutation.mutate({ ...data, recaptcha })
            }
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }
    };

    const registerQuery = useQuery({
        queryKey: ['register', registerId],
        queryFn: () => fetchRegister(registerId),
        enabled: !!registerId,
    })

    const { data: register, isLoading, isFetching } = registerQuery;

    const localDevicesQuery = useQuery({
        queryKey: ['local-devices', registerId],
        queryFn: () => getLocalDevicesByRegisterId(registerId),
        enabled: !!registerId,
    })

    const { data: localDevices } = localDevicesQuery;

    const handleDelete = () => {
        setConfirmBox({
            mainText: `${t('misc_delete')} ${register.name}?`,
            onConfirm: () => {
                deleteRegisterMutation.mutate();
                navigate('/');
            },
        })
    }

    const handleDeleteLocalDevice = (deviceId) => {
        if (!deviceId) return;
        setConfirmBox({
            mainText: `${t('misc_delete')} ${deviceId}?`,
            onConfirm: () => {
                deleteLocalDeviceMutation.mutate(deviceId);
            },
        })
    }

    useEffect(() => {
        if (register) {
            reset(register);
        } else if (retail) {
            setValue('name', retail.name);
            setValue('address', retail.address);
        }
    }, [retail, register, reset, setValue]);

    return (
        <Container maxWidth={'lg'} sx={{ mb: 4, pt: 6 }}>
            <Stack spacing={2}>
                <FormProvider {...mainForm}>
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <Typography variant="h5">{register ? `${register.name} - ${register._id}` : t('misc_add_workplace')}</Typography>
                        {register && <CopyButton value={register._id || ''} />}
                    </Stack>
                    <Grid container spacing={2} sx={{ marginY: 2 }}>
                        <Grid size={{ xs: 12 }}>
                            <Stack spacing={1} direction={'row'} alignItems={'center'}>
                                <Typography variant='h6'>{t('misc_general')}</Typography>
                                <CustomPopover
                                    content={
                                        <Stack spacing={1}>
                                            <Typography variant='h6'>{t('misc_instructions')}</Typography>
                                            <Typography variant='body1'>{t('misc_register_instruction_1')}</Typography>
                                            <Typography variant='h6'>{t('misc_address')}</Typography>
                                            <Typography variant='body2'>{t('misc_address_instruction_1')}:</Typography>
                                            <Typography variant='body2'>1. {t('misc_filling_in_the_address_fields')}</Typography>
                                            <Typography variant='body2'>2. {t('misc_use_map_picker')}</Typography>
                                        </Stack>
                                    }
                                />
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={t('misc_name')}
                                        variant="outlined"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="address.street"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={t('misc_street')}
                                        variant="outlined"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Controller
                                name="address.city"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={t('misc_city')}
                                        variant="outlined"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Controller
                                name="address.zip"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label={t('misc_postal_code')}
                                        variant="outlined"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="location.latitude"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        fullWidth
                                        label={t('misc_latitude')}
                                        variant="outlined"
                                        type="number"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="location.longitude"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        fullWidth
                                        label={t('misc_longitude')}
                                        variant="outlined"
                                        type="number"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="location.allowedRadius"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        fullWidth
                                        label={`${t('misc_allowed_radius')} (m)`}
                                        variant="outlined"
                                        type="number"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <LocationPicker />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='h6'>{t('misc_working_hours')}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    aria-controls={`panel-working-hours-content-${register ? register._id : 'new'}`}
                                    id={`panel-working-hours-header-${register ? register._id : 'new'}`}
                                >
                                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                        <Typography variant='h6'>{t('misc_workplace_working_hours')}</Typography>
                                        {!_.isEmpty(errors?.specificBreaks) && <FeedbackMessage message={new Error(t('misc_check_fields'))} />}
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <OpeningTimeInputs />
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    aria-controls={`panel-breaks-content-${register ? register._id : 'new'}`}
                                    id={`panel-breaks-header-${register ? register._id : 'new'}`}
                                >
                                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                        <Typography variant='h6'>{t('misc_workplace_breaks')}</Typography>
                                        {!_.isEmpty(errors?.specificBreaks) && <FeedbackMessage message={new Error(t('misc_check_fields'))} />}
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <SpecificBreakInputs />
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    aria-controls={`panel-custom-breaks-content-${register ? register._id : 'new'}`}
                                    id={`panel-custom-breaks-header-${register ? register._id : 'new'}`}
                                >
                                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                        <Typography variant='h6'>{t('misc_workplace_custom_breaks')}</Typography>
                                        {!_.isEmpty(errors?.breaks) && <FeedbackMessage message={new Error(t('misc_check_fields'))} />}
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <BreaksInputs />
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='h6'>{t('misc_settings')}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Controller
                                name="maxLocalDevices"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            field.onChange(inputValue === '' ? '' : !isNaN(inputValue) ? parseInt(inputValue) : inputValue);
                                        }}
                                        label={t('misc_max_local_devices')}
                                        variant="outlined"
                                        type="number"
                                        error={fieldState.invalid}
                                        helperText={fieldState.invalid && t(fieldState.error?.message)}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            {localDevices && localDevices.length > 0 ?
                                <Accordion>
                                    <AccordionSummary
                                        expandIcon={<ExpandMore />}
                                        aria-controls={`panel-content-local-devices-${register ? register._id : 'new'}`}
                                        id={`panel-header-local-devices-${register ? register._id : 'new'}`}
                                    >
                                        {t('misc_local_devices')}
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            {localDevices.map((device, index) => {
                                                const distance = device.distance ? calculateKilometersFromMeters(device.distance) : '';
                                                return <Grid key={index} size={{ xs: 12, sm: 6 }}>
                                                    <Card>
                                                        <CardHeader title={device.deviceId} />
                                                        <CardContent>
                                                            <Stack spacing={1}>
                                                                <Typography variant='body1'>UUID: {device.uuid}</Typography>
                                                                <Typography variant='body1'>{t('misc_latitude')}: {device.location.latitude}</Typography>
                                                                <Typography variant='body1'>{t('misc_longitude')}: {device.location.longitude}</Typography>
                                                                <Typography variant='body1'>{t('misc_allowed_radius')}: {device.location.allowedRadius} m</Typography>
                                                                <Typography variant='body1'>{t('misc_distance')}: {distance.kilometers > 0 ? `${distance.kilometers} km` : ''} {`${distance?.meters} m`}</Typography>
                                                            </Stack>
                                                        </CardContent>
                                                        <CardActions><Button variant='contained' color='error' onClick={() => handleDeleteLocalDevice(device.deviceId)}>{t('misc_delete')}</Button></CardActions>
                                                    </Card>
                                                </Grid>
                                            })}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                                :
                                <Typography variant='h6'>{t('misc_no_local_device')}</Typography>}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="isAvailable"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch {...field} checked={field.value} />}
                                        label={t('misc_available')}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        {postMsg && <FeedbackMessage message={postMsg} />}
                    </Grid>
                    <Stack direction={'row'} spacing={1} width={'100%'} alignItems={'center'} justifyContent={!_.isEmpty(errors) ? 'space-between' : 'flex-end'}>
                        {!_.isEmpty(errors) ? <FeedbackMessage message={new Error(t('misc_check_fields'))} /> : null}
                        <Stack direction={'row'} spacing={1}>
                            <Button loading={isLoading || isFetching || createNewRegisterMutation.isPending || updateRegisterMutation.isPending} disabled={deleteRegisterMutation.isPending} variant="contained" color="success" onClick={handleSubmit(onSubmit)}>
                                {register ? t('misc_save') : t('misc_create')}
                            </Button>
                            {register && <Button loading={isLoading || isFetching || deleteRegisterMutation.isPending} disabled={createNewRegisterMutation.isPending || updateRegisterMutation.isPending} variant="contained" color="error" onClick={handleDelete}>
                                {t('misc_delete')}
                            </Button>}
                        </Stack>
                    </Stack>
                </FormProvider>
            </Stack>
        </Container>
    );
}