import { Controller, FormProvider, useForm } from 'react-hook-form'
import { FormControl, FormHelperText, Grid, IconButton, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { DatePicker } from '@mui/x-date-pickers'
import { capitalizeFirstLetterOfString } from '@/utils'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import PropTypes from 'prop-types';

export default function FromToDatePicker({
  start,
  end,
  handleGetDates,
  views = ['year', 'month', 'day'],
}) {
  const { t } = useTranslation()
  const today = dayjs();
  const [initialized, setInitialized] = useState(false)

  const mainUseForm = useForm({
    defaultValues: {
      start: today,
      end: today,
    },
    mode: 'all',
  })

  const { control, handleSubmit, watch, setValue } = mainUseForm

  const onSubmit = async (data) => {
    handleGetDates({ start: data.start, end: data.end })
  }

  useEffect(() => {
    if ((start || end) && !initialized) {
      if (start) setValue('start', start)
      if (end) setValue('end', end)
      handleGetDates({ start: start || today, end: end || today })
      setInitialized(true)
    }
  }, [end, handleGetDates, initialized, setValue, start, today])

  const moveOneMonthForward = () => {
    const nextMonth = dayjs(watch('start')).add(1, 'month');
    const endOfMonth = nextMonth.endOf('month').isSame(today, 'month') ? today : nextMonth.endOf('month');
    setValue('start', nextMonth.startOf('month'))
    setValue('end', endOfMonth)
    handleSubmit(onSubmit)()
  }

  const moveOneMonthBackward = () => {
    const previousMonth = dayjs(watch('start')).subtract(1, 'month');
    setValue('start', previousMonth.startOf('month'))
    setValue('end', previousMonth.endOf('month'))
    handleSubmit(onSubmit)()
  }

  return (
    <FormProvider {...mainUseForm}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Grid container rowSpacing={4.5} columnSpacing={2.75}>
          <Grid xs={3} item>
            <Stack direction="row">
              <IconButton onClick={moveOneMonthBackward}><ArrowBackIosNewIcon /></IconButton>
              <IconButton disabled={dayjs(watch('start')).add(1, 'month').startOf('month').isAfter(today)} onClick={moveOneMonthForward}><ArrowForwardIosIcon /></IconButton>
            </Stack>
          </Grid>
          <Grid item xs={4.5}>
            <Controller
              name="start"
              rules={{
                required: capitalizeFirstLetterOfString(t('misc_required')),
                validate: (value) => {
                  if (watch('end') && dayjs(value).isAfter(watch('end'))) {
                    return capitalizeFirstLetterOfString(
                      t('srv_start_can_not_older_than_end')
                    )
                  }
                  return !dayjs(value).isValid()
                    ? capitalizeFirstLetterOfString(t('srv_invalid_date'))
                    : true
                },
              }}
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth>
                  <DatePicker
                    {...field}
                    inputRef={field.ref}
                    onChange={(e) => {
                      field.onChange(e)
                      handleSubmit(onSubmit)()
                    }}
                    label={t('msg_from')}
                    value={
                      dayjs.isDayjs(field.value)
                        ? field.value
                        : field.value
                          ? dayjs(field.value)
                          : null
                    }
                    disableFuture
                    sx={{ width: '100%' }}
                    maxDate={watch('end') || today}
                    views={views}
                  />
                  {fieldState.invalid && (
                    <FormHelperText
                      sx={{
                        color: (theme) => theme.palette.error.main,
                      }}
                    >
                      {fieldState.error?.message}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={4.5}>
            <Controller
              name="end"
              rules={{
                required: capitalizeFirstLetterOfString(t('misc_required')),
                validate: (value) => {
                  return !dayjs(value).isValid()
                    ? capitalizeFirstLetterOfString(t('srv_invalid_date'))
                    : true
                },
              }}
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth>
                  <DatePicker
                    {...field}
                    inputRef={field.ref}
                    onChange={(e) => {
                      field.onChange(e)
                      handleSubmit(onSubmit)()
                    }}
                    label={t('msg_to')}
                    value={
                      dayjs.isDayjs(field.value)
                        ? field.value
                        : field.value
                          ? dayjs(field.value)
                          : null
                    }
                    disableFuture
                    sx={{ width: '100%' }}
                    maxDate={today}
                    views={views}
                  />
                  {fieldState.invalid && (
                    <FormHelperText
                      sx={{
                        color: (theme) => theme.palette.error.main,
                      }}
                    >
                      {fieldState.error?.message}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </form>
    </FormProvider>
  )
}

FromToDatePicker.propTypes = {
  start: PropTypes.object,
  end: PropTypes.object,
  handleGetDates: PropTypes.func.isRequired,
  views: PropTypes.array,
}