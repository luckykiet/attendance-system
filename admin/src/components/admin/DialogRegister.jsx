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
} from '@mui/material';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import useTranslation from '@/hooks/useTranslation';
import { useIsModalOpen, useRegisterId, useReset, useSetIsModalOpen } from '@/stores/register';
import { getDefaultRegister, TIME_FORMAT } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRegister, fetchRegister, updateRegister } from '@/api/register';
import FeedbackMessage from '../FeedbackMessage';
import { useRetail, useSetAlertMessage } from '@/stores/root';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { CONFIG } from '@/configs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import OpeningTimeInputs from '../OpeningHoursInputs';
dayjs.extend(customParseFormat);


const timeValidation = (open, close) => dayjs(close, TIME_FORMAT).isAfter(dayjs(open, TIME_FORMAT));

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
  openingHours: z.object({
    mon: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
    tue: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
    wed: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
    thu: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
    fri: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
    sat: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
    sun: z.object({
      open: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      close: z.string({ required_error: 'misc_required' }).refine((date) => dayjs(date, TIME_FORMAT).isValid(), { message: TIME_FORMAT }),
      isOpen: z.boolean(),
    }).refine(({ open, close }) => timeValidation(open, close), {
      message: 'srv_close_time_before_open_time',
      path: ['close'],
    }),
  }),
  isAvailable: z.boolean(),
});


export default function DialogRegister() {
  const { t } = useTranslation();

  const registerId = useRegisterId();
  const retail = useRetail();
  const resetRegister = useReset();
  const [isModalOpen, setIsModalOpen] = [useIsModalOpen(), useSetIsModalOpen()];
  const [postMsg, setPostMsg] = useState('');
  const setAlertMessage = useSetAlertMessage();
  const queryClient = useQueryClient();
  const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY);

  const mainForm = useForm({
    mode: 'onBlur',
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
    onSuccess: (data) => {
      setAlertMessage({ message: data, severity: 'success' });
      queryClient.invalidateQueries(['register']);
      resetRegister();
    }
  })

  const updateRegisterMutation = useMutation({
    mutationFn: (data) => updateRegister(data),
    onError: (error) => {
      setPostMsg(new Error(error))
    },
    onSuccess: (data) => {
      setAlertMessage({ message: data, severity: 'success' });
      queryClient.invalidateQueries(['register']);
    }
  })

  const onSubmit = async (data) => {
    try {
      const recaptchaToken = await executeRecaptcha(`${registerId ? 'update' : 'create'}register`);

      if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
        throw new Error(t('srv_invalid_recaptcha'));
      }

      if (registerId) {
        updateRegisterMutation.mutate({ ...data, recaptcha: recaptchaToken || '' })
      } else {
        createNewRegisterMutation.mutate({ ...data, recaptcha: recaptchaToken || '' })
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

  const { data: register } = registerQuery;

  useEffect(() => {
    if (register) {
      reset(register);
    } else if (retail) {
      setValue('name', retail.name);
      setValue('address', retail.address);
    }
  }, [retail, register, reset, setValue]);

  return (
    <Dialog fullWidth maxWidth="md" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <FormProvider {...mainForm}>
        <DialogTitle>{t('misc_create_company')}</DialogTitle>
        <DialogContent>
          <Grid2 container spacing={2} sx={{ marginY: 2 }}>
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
            <Grid2 size={{ xs: 12, sm: 4 }}>
              <Controller
                name="location.latitude"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
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
                    fullWidth
                    label={t('misc_allowed_radius')}
                    variant="outlined"
                    type="number"
                    error={fieldState.invalid}
                    helperText={fieldState.invalid && t(fieldState.error.message)}
                  />
                )}
              />
            </Grid2>

            <OpeningTimeInputs />

            <Grid2 size={{ xs: 12 }}>
              <Controller
                name="isAvailable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={t('msg_is_active')}
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
          <LoadingButton variant="contained" color="success" onClick={handleSubmit(onSubmit)}>
            {t('misc_create')}
          </LoadingButton>
          <Button variant="contained" color="error" onClick={() => resetRegister()}>
            {t('misc_cancel')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}