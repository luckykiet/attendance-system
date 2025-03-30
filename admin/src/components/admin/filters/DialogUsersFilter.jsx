import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  initialFormFilters,
  useFormFilters,
  useIsModalOpen,
  useSetFormFilters,
  useSetIsModalOpen,
} from '@/stores/users'

import { Clear } from '@mui/icons-material'
import _ from 'lodash'
import { BOOLEAN_SELECT_OPTIONS } from '@/utils'
import useTranslation from '@/hooks/useTranslation'

const formFiltersSchema = z.object({
  isAvailable: z.enum(BOOLEAN_SELECT_OPTIONS),
  hasDeviceId: z.enum(BOOLEAN_SELECT_OPTIONS)
})

export default function DialogEmployeesFilter() {
  const { t } = useTranslation()
  const [formFilters, setFormFilters] = [useFormFilters(), useSetFormFilters()]

  const isModalOpen = useIsModalOpen()
  const setIsModalOpen = useSetIsModalOpen()

  const {
    control,
    formState: { errors, dirtyFields },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    mode: 'all',
    defaultValues: {
      ...formFilters,
    },
    resolver: zodResolver(formFiltersSchema),
  })

  const handleApply = (data) => {
    setFormFilters(data)
    reset(data)
    setIsModalOpen(false)
  }

  const handleReset = () => {
    reset(initialFormFilters, { keepDefaultValues: true })
  }

  return (
    <Dialog
      open={isModalOpen}
      fullWidth
      maxWidth="sm"
      onClose={() => setIsModalOpen(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle>
        {t('misc_filter')}{' '}
        <IconButton
          onClick={handleReset}
          disabled={_.isEqual(watch(), initialFormFilters)}
          color="error"
        >
          <Clear />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container sx={{ padding: 3 }} spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="isAvailable"
              control={control}
              render={({ field, fieldState }) => (
                <Stack spacing={2} direction={'row'}>
                  <IconButton
                    onClick={() => field.onChange('all')}
                    disabled={field.value === 'all'}
                    color="error"
                  >
                    <Clear />
                  </IconButton>
                  <FormControl fullWidth>
                    <InputLabel id="selectIsAvailable-label">
                      {t('misc_is_available')}
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="selectIsAvailable-label"
                      id="selectIsAvailable"
                      label={`${t('misc_is_available')}`}
                      error={fieldState.invalid}
                      onBlur={handleSubmit}
                      sx={{
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'pre',
                      }}
                    >
                      {BOOLEAN_SELECT_OPTIONS.map((r) => (
                        <MenuItem value={r} key={r}>
                          {r === 'false' ? t('misc_no') : r === 'true' ? t('misc_yes') : t(`misc_${r}`)}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.invalid && (
                      <FormHelperText
                        sx={{
                          color: (theme) => theme.palette.error.main,
                        }}
                      >
                        {fieldState.error.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit(handleApply)}
          disabled={!_.isEmpty(errors) || _.isEmpty(dirtyFields)}
        >
          {t('misc_apply')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => setIsModalOpen(false)}
        >
          {t('misc_close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
