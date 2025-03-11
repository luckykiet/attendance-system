import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
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
} from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import useTranslation from '@/hooks/useTranslation';
import { useIsModalOpen, useRegisterId, useReset, useSetIsModalOpen } from '@/stores/register';
import { calculateKilometersFromMeters, getDaysOfWeek, getDefaultRegister, TIME_FORMAT } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRegister, deleteRegister, fetchRegister, updateRegister } from '@/api/register';
import FeedbackMessage from '../FeedbackMessage';
import { useRetail, useSetAlertMessage } from '@/stores/root';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import OpeningTimeInputs from '@/components/WorkingHoursInputs';
import LocationPicker from '@/components/LocationPicker';
import { useSetConfirmBox } from '@/stores/confirm';
import { ExpandMore } from '@mui/icons-material';
import CopyButton from './CopyButton';
import { getLocalDevicesByRegisterId } from '@/api/local-devices';
import { deleteLocalDevice } from '@/api/local-device';
import { useConfigStore } from '@/stores/config';
import CustomPopover from '@/components/CustomPopover';
import BreaksInputs from '@/components/BreaksInputs';
import { SPECIFIC_BREAKS } from '@/configs';
import SpecificBreakInputs from '@/components/SpecificBreakInputs';

dayjs.extend(customParseFormat);

const workingHourSchema = z.object({
  start: z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
  end: z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
  isOverNight: z.boolean(),
  isAvailable: z.boolean(),
}).superRefine(({ start, end, isOverNight }, ctx) => {
  const startTime = dayjs(start, TIME_FORMAT, true);
  const endTime = dayjs(end, TIME_FORMAT, true);

  if (!startTime.isValid() || !endTime.isValid()) {
    return;
  }

  const expectedOvernight = endTime.isBefore(startTime);

  if (expectedOvernight !== isOverNight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'srv_invalid_overnight',
      path: ['isOverNight'],
    });
  }
});

const SpecificBreakSchema = z.object({
  start: z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
  end: z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
  type: z.enum(SPECIFIC_BREAKS, { required_error: 'misc_required' }),
  duration: z.number({ required_error: 'misc_required' }).min(15, { message: "srv_invalid_duration" }).max(24 * 60, { message: "srv_invalid_duration" }), // in minutes
  isOverNight: z.boolean(),
  isAvailable: z.boolean(),
}).superRefine(({ start, end, isOverNight }, ctx) => {
  const startTime = dayjs(start, TIME_FORMAT, true);
  const endTime = dayjs(end, TIME_FORMAT, true);

  if (!startTime.isValid() || !endTime.isValid()) {
    return;
  }

  const expectedOvernight = endTime.isBefore(startTime);

  if (expectedOvernight !== isOverNight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'srv_invalid_overnight',
      path: ['isOverNight'],
    });
  }
});

const BreakSchema = z.object({
  start: z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
  end: z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
  name: z.string().min(1, { message: "misc_required" }),
  duration: z.number({ required_error: 'misc_required' }).min(15, { message: "srv_invalid_duration" }).max(24 * 60, { message: "srv_invalid_duration" }), // in minutes
  isOverNight: z.boolean(),
}).superRefine(({ start, end, isOverNight }, ctx) => {
  const startTime = dayjs(start, TIME_FORMAT, true);
  const endTime = dayjs(end, TIME_FORMAT, true);

  if (!startTime.isValid() || !endTime.isValid()) {
    return;
  }

  const expectedOvernight = endTime.isBefore(startTime);

  if (expectedOvernight !== isOverNight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'srv_invalid_overnight',
      path: ['isOverNight'],
    });
  }
});

const registerSchema = z.object({
  name: z.string().min(1, { message: 'misc_required' }).max(255),
  address: z.object({
    street: z.string().min(1, { message: 'misc_required' }).max(255),
    city: z.string().min(1, { message: 'misc_required' }).max(255),
    zip: z.string().min(1, { message: 'misc_required' }).max(20),
  }),
  location: z.object({
    latitude: z.number().min(-90, { message: 'srv_invalid_latitude' }).max(90),
    longitude: z.number().min(-180, { message: 'srv_invalid_longitude' }).max(180),
    allowedRadius: z.number().positive().max(5000),
  }),
  workingHours: z.object({
    ...getDaysOfWeek(true).reduce((acc, day) => {
      acc[day] = workingHourSchema;
      return acc;
    }, {})
  }),
  specificBreaks: z.object({
    ...getDaysOfWeek(true).reduce((acc, day) => {
      acc[day] = z.array(SpecificBreakSchema);
      return acc;
    }, {})
  }
  ),
  breaks: z.object({
    ...getDaysOfWeek(true).reduce((acc, day) => {
      acc[day] = z.array(BreakSchema);
      return acc;
    }, {})
  }
  ),
  maxLocalDevices: z.number().int().min(0, { message: 'srv_invalid_device_count' }),
  isAvailable: z.boolean(),
}).superRefine(({ breaks, workingHours }, ctx) => {
  Object.entries(breaks).forEach(([day, dayBreaks]) => {

    const validateBreaksWithinWorkingHours = (brk, workingHours, timeFormat = TIME_FORMAT) => {
      const workStart = dayjs(workingHours.start, timeFormat);
      let workEnd = dayjs(workingHours.end, timeFormat);

      if (workEnd.isBefore(workStart)) {
        workEnd = workEnd.add(1, 'day');
      }

      let breakStart = dayjs(brk.start, timeFormat);
      let breakEnd = dayjs(brk.end, timeFormat);

      if (breakEnd.isBefore(breakStart)) {
        breakEnd = breakEnd.add(1, 'day');
      }

      return {
        isStartValid: breakStart.isSameOrAfter(workStart),
        isEndValid: breakEnd.isSameOrBefore(workEnd),
      };
    };

    const workingHour = workingHours[day];
    Object.entries(dayBreaks).forEach(([index, brk]) => {
      const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHour);
      if (!isStartValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'srv_invalid_break_range',
          path: ['breaks', day, index, 'start'],
        });
      }

      if (!isEndValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'srv_invalid_break_range',
          path: ['breaks', day, index, 'end'],
        });
      }
    });
  });
});

export default function DialogRegister() {
  const { t } = useTranslation();
  const config = useConfigStore();
  const registerId = useRegisterId();
  const retail = useRetail();
  const resetRegister = useReset();
  const [isModalOpen, setIsModalOpen] = [useIsModalOpen(), useSetIsModalOpen()];
  const [postMsg, setPostMsg] = useState('');
  const setAlertMessage = useSetAlertMessage();
  const queryClient = useQueryClient();
  const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);
  const setConfirmBox = useSetConfirmBox();

  const mainForm = useForm({
    mode: 'all',
    resolver: zodResolver(registerSchema),
    defaultValues: getDefaultRegister(),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = mainForm;

  const createNewRegisterMutation = useMutation({
    mutationFn: (data) => createRegister(data),
    onError: (error) => {
      setPostMsg(new Error(error))
    },
    onSuccess: () => {
      setAlertMessage({ msg: 'srv_created', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['register'] });
      queryClient.invalidateQueries({ queryKey: ['registers'] });
      resetRegister();
    }
  })

  const updateRegisterMutation = useMutation({
    mutationFn: (data) => updateRegister(data),
    onError: (error) => {
      setPostMsg(new Error(error))
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
      setPostMsg(new Error(error))
    },
    onSuccess: (data) => {
      setAlertMessage({ msg: data, severity: 'success' });
      queryClient.invalidateQueries(['register']);
      resetRegister();
    }
  })

  const deleteLocalDeviceMutation = useMutation({
    mutationFn: (id) => deleteLocalDevice(id),
    onError: (error) => {
      setPostMsg(new Error(error))
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

  const handleClose = () => {
    reset(getDefaultRegister());
    resetRegister();
  };

  const handleDelete = () => {
    setConfirmBox({
      mainText: `${t('misc_delete')} ${register.name}?`,
      onConfirm: () => {
        deleteRegisterMutation.mutate();
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
  }, [retail, register, reset, setValue, isModalOpen]);

  return (
    <Dialog fullWidth maxWidth="md" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <FormProvider {...mainForm}>
        <DialogTitle>
          <Stack direction={'row'} spacing={1} alignItems={'center'}>
            <Typography variant="h6">{register ? `${register.name} - ${register._id}` : t('misc_add_workplace')}</Typography>
            {register && <CopyButton value={register._id || ''} />}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Grid2 container spacing={2} sx={{ marginY: 2 }}>
            <Grid2 size={{ xs: 12 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 3 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 3 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <LocationPicker />
            </Grid2>

            <Grid2 size={{ xs: 12, sm: 4 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 4 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 4 }}>
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
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Divider />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Typography variant='h6'>{t('misc_working_hours')}</Typography>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`panel-working-hours-content-${register ? register._id : 'new'}`}
                  id={`panel-working-hours-header-${register ? register._id : 'new'}`}
                >
                  <Typography variant='h6'>{t('misc_workplace_working_hours')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <OpeningTimeInputs />
                </AccordionDetails>
              </Accordion>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`panel-breaks-content-${register ? register._id : 'new'}`}
                  id={`panel-breaks-header-${register ? register._id : 'new'}`}
                >
                  <Typography variant='h6'>{t('misc_workplace_breaks')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <SpecificBreakInputs />
                </AccordionDetails>
              </Accordion>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`panel-custom-breaks-content-${register ? register._id : 'new'}`}
                  id={`panel-custom-breaks-header-${register ? register._id : 'new'}`}
                >
                  <Typography variant='h6'>{t('misc_workplace_custom_breaks')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <BreaksInputs />
                </AccordionDetails>
              </Accordion>
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Divider />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
              <Typography variant='h6'>{t('misc_settings')}</Typography>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Controller
                name="maxLocalDevices"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    fullWidth
                    label={`${t('misc_max_local_devices')}`}
                    variant="outlined"
                    type="number"
                    error={fieldState.invalid}
                    helperText={fieldState.invalid && t(fieldState.error.message)}
                  />
                )}
              />
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
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
                    <Grid2 container spacing={2}>
                      {localDevices.map((device, index) => {
                        const distance = device.distance ? calculateKilometersFromMeters(device.distance) : '';
                        return <Grid2 key={index} size={{ xs: 12, sm: 6 }}>
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
                            <CardActions><LoadingButton variant='contained' color='error' onClick={() => handleDeleteLocalDevice(device.deviceId)}>{t('misc_delete')}</LoadingButton></CardActions>
                          </Card>
                        </Grid2>
                      })}
                    </Grid2>
                  </AccordionDetails>
                </Accordion>
                :
                <Typography variant='h6'>{t('misc_no_local_device')}</Typography>}
            </Grid2>
            <Grid2 size={{ xs: 12 }}>
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
            </Grid2>
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            {postMsg && <FeedbackMessage message={postMsg} />}
          </Grid2>
        </DialogContent>
        <DialogActions>
          <LoadingButton loading={isLoading || isFetching || createNewRegisterMutation.isPending || updateRegisterMutation.isPending} disabled={deleteRegisterMutation.isPending} variant="contained" color="success" onClick={handleSubmit(onSubmit)}>
            {register ? t('misc_save') : t('misc_create')}
          </LoadingButton>
          {register && <LoadingButton loading={isLoading || isFetching || deleteRegisterMutation.isPending} disabled={createNewRegisterMutation.isPending || updateRegisterMutation.isPending} variant="contained" color="error" onClick={handleDelete}>
            {t('misc_delete')}
          </LoadingButton>}
          <Button variant="outlined" color="error" onClick={handleClose}>
            {t('misc_cancel')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}