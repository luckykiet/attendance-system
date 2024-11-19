import { CardActions, Pagination, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import Grid2 from '@mui/material/Grid2'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import SearchBar from '@/components/admin/SearchBar'
import { checkPrivileges } from '@/utils'
import useTranslation from '@/hooks/useTranslation'
import PropTypes from 'prop-types';
import { useAuthStore } from '@/stores/auth'
import { FormProvider, useForm } from 'react-hook-form'
import { fetchRegisters } from '@/api/registers';
import { fetchEmployeeWorkingAt } from '@/api/employee'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import LoadingCircle from '../LoadingCircle'
import WorkingAtForm from './WorkingAtForm'
import FeedbackMessage from '../FeedbackMessage'
import { LoadingButton } from '@mui/lab'
import { useSetAlertMessage } from '@/stores/root'
import { updateWorkingAts } from '@/api/working-ats'
import useRecaptchaV3 from '@/hooks/useRecaptchaV3'
import { CONFIG } from '@/configs'
import _ from 'lodash'

const MAX_ROWS_PER_PAGE = 6
const not = (a, b, property = '_id') => {
  return a.filter(
    (valueA) => !b.some((valueB) => valueA[property] === valueB[property])
  )
}

const union = (a, b) => {
  return [...a, ...not(b, a)]
}


const intersection = (a, b, property = '_id') => {
  return a.filter((valueA) =>
    b.some((valueB) => valueA[property] === valueB[property])
  )
}

const setDirty = (array) => {
  return array.map((element) => ({ ...element, isDirty: !element.isDirty }))
}

const sortByIsDirtyAndField = (
  a,
  b,
  property1 = 'isDirty',
  property2 = 'name'
) => {
  if (a[property1] && !b[property1]) {
    return -1
  } else if (!a[property1] && b[property1]) {
    return 1
  } else {
    return a[property2] - b[property2]
  }
}

const numberOfChecked = (checked, items) => intersection(checked, items).length

const searchParams = ['tin', 'name', 'address.city', 'address.street', 'address.zip']

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((value, key) => {
    return value && value[key] !== undefined ? value[key] : undefined
  }, obj)
}

const handleSearch = (query, items) => {
  if (!items) return []
  if (!query) return items

  const lowerCaseQuery = query.toLowerCase()

  return items.filter((item) => {
    return searchParams.some((param) => {
      const value = getNestedValue(item, param)
      return value !== undefined && value.toString().toLowerCase().includes(lowerCaseQuery)
    })
  })
}

const CustomList = ({
  title,
  items,
  checked,
  handleToggle,
  handleToggleAll,
}) => {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { t } = useTranslation()

  const startIndex = (currentPage - 1) * MAX_ROWS_PER_PAGE
  const endIndex = startIndex + MAX_ROWS_PER_PAGE

  const filteredItems = handleSearch(search, items)
  const pages = Math.ceil(filteredItems.length / MAX_ROWS_PER_PAGE) || 1

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const handleSearchChange = (value) => {
    setSearch(value)
  }

  const handlePageChange = (event, page) => {
    setCurrentPage(page)
  }

  return (
    <Card sx={{ width: '100%', py: 2 }}>
      <CardHeader
        sx={{ px: 2, py: 1 }}
        avatar={
          <Checkbox
            onClick={handleToggleAll(items)}
            checked={numberOfChecked(checked, items) === items.length && items.length !== 0}
            indeterminate={numberOfChecked(checked, items) !== items.length && numberOfChecked(checked, items) !== 0}
            disabled={items.length === 0 || !checkPrivileges('assignEmployees', user?.role)}
          />
        }
        title={title}
        subheader={`${numberOfChecked(checked, items)}/${items.length} ${t('misc_selected')}`}
      />
      <CardHeader
        title={
          <SearchBar
            defaultSearch={search}
            handleSearchChange={handleSearchChange}
            debounced={false}
            placeholder={`${t('misc_to_search')} ${t('misc_tin')}, ${t('misc_name')}, ${t('misc_address')}...`}
          />
        }
        sx={{ px: 2, py: 1 }}
      />
      <Divider />
      <List
        sx={{
          minHeight: 300,
          bgcolor: 'background.paper',
          height: 'max-content',
        }}
        dense
        component="div"
        role="list"
      >
        {filteredItems.slice(startIndex, endIndex).map((register) => {
          const labelId = `transfer-list-all-item-${register._id}-label`
          return (
            <ListItem
              key={register._id}
              role="listitem"
              onClick={handleToggle(register)}
              sx={{
                backgroundColor: register.isDirty
                  ? (theme) => theme.palette.grey[300]
                  : undefined,
                cursor: 'pointer',
              }}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked.findIndex((c) => c._id === register._id) !== -1}
                  disabled={!checkPrivileges('assignEmployees', user?.role)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText
                id={labelId}
                primary={`${register.name} - ${register.address.street}, ${register.address.city} ${register.address.zip}`}
              />
            </ListItem>
          )
        })}
      </List>
      <Divider />
      <CardActions sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={pages}
          page={currentPage}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
        />
      </CardActions>
    </Card>
  )
}

CustomList.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  checked: PropTypes.array.isRequired,
  handleToggle: PropTypes.func.isRequired,
  handleToggleAll: PropTypes.func.isRequired,
}

const preprocessRegisters = ({ workingAts = [], registers = [] }) => {
  const right = registers
    .filter((register) => !workingAts.some((workingAt) => workingAt.registerId === register._id && workingAt.isAvailable))
    .map((register) => ({ ...register, isDirty: false }))

  const left = registers
    .filter((register) => right.every((rightItem) => rightItem._id !== register._id))
    .map((register) => ({ ...register, isDirty: false }))

  return { leftData: left, rightData: right }
}

export default function TransferListEmployees({ employeeId }) {
  const [checked, setChecked] = useState([])
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [postMsg, setPostMsg] = useState('')
  const setAlertMessage = useSetAlertMessage()
  const queryClient = useQueryClient()
  const executeRecaptcha = useRecaptchaV3(CONFIG.RECAPTCHA_SITE_KEY)

  const mainForm = useForm({
    defaultValues: {
      left: [],
      right: [],
    },
  })

  const { handleSubmit, setValue, watch, reset, formState: { errors, dirtyFields } } = mainForm

  const left = watch("left")
  const right = watch("right")

  const leftChecked = intersection(checked, left)
  const rightChecked = intersection(checked, right)

  const registersQuery = useQuery({
    queryKey: ['registers', { isAvailable: true }],
    queryFn: () => fetchRegisters({ isAvailable: true }),
    enabled: !!employeeId,
  });

  const workingAtQuery = useQuery({
    queryKey: ['workingAts', { employeeId }],
    queryFn: () => fetchEmployeeWorkingAt(employeeId),
    enabled: !!employeeId,
  });

  const registers = registersQuery.data
  const workingAts = workingAtQuery.data

  const saveWorkingAtsMutation = useMutation({
    mutationFn: (data) => updateWorkingAts(data),
    onError: (error) => {
      setPostMsg(new Error(error))
    },
    onSuccess: () => {
      setAlertMessage({ msg: 'srv_updated', severity: 'success' });
      queryClient.invalidateQueries(['workingAts', { employeeId }])
      queryClient.invalidateQueries(['registers', { isAvailable: true }])
    }
  })

  const handleToggle = (value) => () => {
    const isChecked = checked.some((c) => c._id === value._id)
    const newChecked = isChecked ? checked.filter((c) => c._id !== value._id) : [...checked, value]
    setChecked(newChecked)
  }

  const handleToggleAll = (items) => () => {
    if (numberOfChecked(checked, items) === items.length) {
      setChecked(not(checked, items))
    } else {
      setChecked(union(checked, items))
    }
  }

  const handleCheckedRight = () => {
    if (leftChecked.length === 0) return
    const dirtyArray = setDirty(leftChecked)
    setValue('right', [...right, ...dirtyArray].sort(sortByIsDirtyAndField), { shouldDirty: true })
    setValue('left', left.filter((item) => !dirtyArray.some((dirtyItem) => dirtyItem._id === item._id)), { shouldDirty: true })
    setChecked(checked.filter((item) => !dirtyArray.some((dirtyItem) => dirtyItem._id === item._id)))
  }

  const handleCheckedLeft = () => {
    if (rightChecked.length === 0) return
    const dirtyArray = setDirty(rightChecked)
    setValue('left', [...left, ...dirtyArray].sort(sortByIsDirtyAndField), { shouldDirty: true })
    setValue('right', right.filter((item) => !dirtyArray.some((dirtyItem) => dirtyItem._id === item._id)), { shouldDirty: true })
    setChecked(checked.filter((item) => !dirtyArray.some((dirtyItem) => dirtyItem._id === item._id)))
  }

  const onSubmit = async (data) => {
    try {
      setPostMsg('')
      const recaptchaToken = await executeRecaptcha('updateworkingats');

      if (import.meta.env.MODE !== 'development' && !recaptchaToken) {
        throw new Error(t('srv_invalid_recaptcha'));
      }
      const newLeft = data.left.filter((register) => register.isDirty).map((register) => ({ registerId: register._id, isAvailable: true }))
      const newRight = data.right.filter((register) => register.isDirty).map((register) => ({ registerId: register._id, isAvailable: false }))
      saveWorkingAtsMutation.mutate({
        employeeId,
        workingAts: [...newLeft, ...newRight],
        recaptcha: recaptchaToken || ''
      })
    }
    catch (error) {
      setPostMsg(error instanceof Error ? error : new Error(error));
    }
  }

  const calculation = useMemo(() => preprocessRegisters({ workingAts, registers }), [workingAts, registers])

  useEffect(() => {
    if (calculation) {
      reset({ left: calculation.leftData, right: calculation.rightData })
    }
  }, [calculation, reset])

  return (
    <Stack spacing={4}>
      <Typography variant="h6">{t('misc_workplaces')}</Typography>
      <FormProvider {...mainForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Grid2 container spacing={2} justifyContent="center" alignItems="center">
              <Grid2 size={{ xs: 12, md: 5 }}>
                {registersQuery.isLoading || workingAtQuery.isLoading ? (
                  <LoadingCircle />
                ) : (
                  <CustomList
                    title={t('misc_working_at')}
                    items={left}
                    checked={checked}
                    handleToggle={handleToggle}
                    handleToggleAll={handleToggleAll}
                  />
                )}
              </Grid2>
              <Grid2 size={{ xs: 12, md: 2 }}>
                <Grid2 container direction="column" alignItems="center">
                  <Button
                    sx={{ my: 0.5 }}
                    variant="outlined"
                    size="small"
                    onClick={handleCheckedRight}
                    disabled={
                      leftChecked.length === 0 ||
                      !checkPrivileges('assignEmployees', user?.role)
                    }
                  >
                    &gt;
                  </Button>
                  <Button
                    sx={{ my: 0.5 }}
                    variant="outlined"
                    size="small"
                    onClick={handleCheckedLeft}
                    disabled={
                      rightChecked.length === 0 ||
                      !checkPrivileges('assignEmployees', user?.role)
                    }
                  >
                    &lt;
                  </Button>
                </Grid2>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 5 }}>
                {registersQuery.isLoading || workingAtQuery.isLoading ? (
                  <LoadingCircle />
                ) : (
                  <CustomList
                    title={t('misc_companies')}
                    items={right}
                    checked={checked}
                    handleToggle={handleToggle}
                    handleToggleAll={handleToggleAll}
                    registers={registers}
                    workingAts={workingAts}
                  />
                )}
              </Grid2>
            </Grid2>
            {postMsg && <FeedbackMessage message={postMsg} />}
            <LoadingButton
              sx={{ minWidth: '200px' }}
              variant="contained"
              color={"success"}
              type="submit"
              loading={saveWorkingAtsMutation.isPending}
              disabled={!_.isEmpty(errors) || _.isEmpty(dirtyFields)}
            >
              {t('misc_save')}
            </LoadingButton>
          </Stack>
        </form>
      </FormProvider>
      {calculation.leftData.length > 0 && <>
        <Divider />
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              {t('misc_working_at')}
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            {calculation.leftData.map((register) => {
              const workingAt = workingAts.find((workingAt) => workingAt.registerId === register._id)
              return (
                <WorkingAtForm key={register._id} employeeId={employeeId} register={register} workingAt={workingAt} />
              )
            })}
          </Grid2>
        </Grid2>
      </>}
    </Stack>
  )
}

TransferListEmployees.propTypes = {
  employeeId: PropTypes.string.isRequired,
}
