import { Button, MenuItem, Select, Stack, styled } from '@mui/material'
import {
  checkPrivileges,
  formatPhoneNumber,
  getComparator,
  stableSort,
} from '@/utils/functions'
import {
  initialFormFilters,
  limits,
  useFormFilters,
  useLimit,
  useSearch,
  useSetIsModalOpen,
  useSetLimit,
  useSetSearch,
} from '@/stores/employees'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import Box from '@mui/material/Box'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import IconButton from '@mui/material/IconButton'
import LoadingCircle from '@/components/LoadingCircle'
import Paper from '@mui/material/Paper'
import PropTypes from 'prop-types'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchBar from '@/components/admin/SearchBar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import _ from 'lodash'

import useTranslation from '@/hooks/useTranslation'
import { visuallyHidden } from '@mui/utils'
import DialogEmployeesFilter from '@/components/admin/filters/DialogEmployeesFilter'
import { fetchEmployees } from '@/api/employees'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import { PersonAdd } from '@mui/icons-material'
import { defaultAppName } from '@/configs'
import { useConfigStore } from '@/stores/config'

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.grey[50],
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: `${theme.palette.grey[300]} !important`,
  },
}))

const EnhancedTableHead = (props) => {
  const { t } = useTranslation()
  const { order, orderBy, rowCount, onRequestSort } = props
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property)
  }

  const headCells = [
    {
      id: 'name',
      numeric: false,
      disablePadding: false,
      label: t('misc_full_name'),
    },
    {
      id: 'email',
      numeric: false,
      disablePadding: false,
      label: t('misc_email'),
    },
    {
      id: 'phone',
      numeric: false,
      disablePadding: false,
      label: t('misc_telephone'),
    },
    {
      id: 'deviceId',
      numeric: false,
      disablePadding: false,
      label: t('misc_has_registered_device'),
    },
    {
      id: 'isAvailable',
      numeric: false,
      disablePadding: false,
      label: t('misc_is_available'),
    },
  ]

  return (
    <TableHead>
      <TableRow>
        <TableCell>
          {t('misc_quantity_shortcut')}:{' '}
          {rowCount}
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {typeof headCell.label === 'string'
                ? t(headCell.label)
                : headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
}

const EnhancedTableToolbar = () => {
  const { t } = useTranslation()
  const limit = useLimit()
  const setLimit = useSetLimit()
  const queryClient = useQueryClient()
  const setIsModalOpen = useSetIsModalOpen()
  const formFilters = useFormFilters()

  const handleSetLimit = (e) => {
    const { value } = e.target
    setLimit(value)
  }

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        py: 1,
      }}
    >
      <IconButton
        sx={{ mr: 2 }}
        onClick={() =>
          queryClient.invalidateQueries({
            queryKey: ['items'],
          })
        }
      >
        <RefreshIcon />
      </IconButton>
      <Typography
        sx={{ flex: '1 1 100%', display: { xs: 'none', sm: 'flex' } }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        {t('misc_employees')}
      </Typography>
      <Select
        sx={{
          mr: 2,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'pre',
          minWidth: 'fit-content',
        }}
        required
        value={limit}
        onChange={handleSetLimit}
      >
        {limits.map((l) => (
          <MenuItem value={l} key={l}>
            {l}
          </MenuItem>
        ))}
      </Select>
      <Tooltip title={t('misc_filter')}>
        <Button
          size="large"
          color={
            !_.isEqual(formFilters, initialFormFilters) ? 'warning' : 'inherit'
          }
          onClick={() => setIsModalOpen(true)}
          startIcon={
            !_.isEqual(formFilters, initialFormFilters) ? (
              <FilterListIcon />
            ) : (
              <FilterListOffIcon />
            )
          }
        >
          {t('misc_filter')}
        </Button>
      </Tooltip>
    </Toolbar>
  )
}

const ReactTable = ({ items, loading }) => {
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('createdAt')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [selected, setSelected] = useState([])
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    setPage(0)
  }, [items])

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = items.map((n) => n.name)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - items.length) : 0
  const visibleRows = useMemo(
    () =>
      stableSort(items, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [order, orderBy, page, rowsPerPage, items]
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={'medium'}
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={items.length}
            />
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    sx={{ textAlign: { xs: 'left', md: 'center' } }}
                    colSpan={'100%'}
                  >
                    <LoadingCircle />
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    sx={{ textAlign: { xs: 'left', md: 'center' } }}
                    colSpan={'100%'}
                  >
                    {t('srv_no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => {
                  return (
                    <StyledTableRow
                      tabIndex={-1}
                      key={row._id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/employee/${row._id}`)
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>{row._id ? row._id.slice(-5) : ''}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Typography
                          component={'a'}
                          href={`mailto:${row.email}`}
                          variant="body2"
                          sx={{ whiteSpace: 'nowrap' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Typography
                          component={'a'}
                          href={`tel:${row.phone}`}
                          variant="body2"
                          sx={{ whiteSpace: 'nowrap' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatPhoneNumber(row.phone, true)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={_.isEmpty(row.deviceId) ? 'error' : 'success'}
                          sx={{ fontWeight: 700 }}
                        >
                          {_.isEmpty(row.deviceId) ? t('misc_no') : t('misc_yes')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={row.isAvailable ? 'success' : 'error'}
                          sx={{ fontWeight: 700 }}
                        >
                          {row.isAvailable ? t('misc_yes') : t('misc_no')}
                        </Typography>
                      </TableCell>
                    </StyledTableRow>
                  )
                })
              )}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 53 * emptyRows,
                  }}
                >
                  <TableCell colSpan={'100%'} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          labelRowsPerPage={t('misc_rows_per_page')}
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  )
}

ReactTable.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
}

export default function EmployeesPage() {
  const { user } = useAuthStore()
  const config = useConfigStore()
  const limit = useLimit()
  const search = useSearch()
  const setSearch = useSetSearch()
  const formFilters = useFormFilters()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { isLoading, isFetching, data, error, isError } = useQuery({
    queryKey: [
      'employees',
      {
        limit: limit,
        search: search,
        filters: formFilters,
      },
    ],
    queryFn: () =>
      fetchEmployees({
        limit: limit,
        search: search,
        filters: formFilters,
      }),
    enabled: checkPrivileges('getEmployees', user?.role),
  })

  if (isError) {
    console.log(error.message)
  }

  const handleSearchChange = (value) => {
    setSearch(value)
  }

  const title = `${t('misc_employees')} | ${config.appName || defaultAppName}`

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'end', mb: 3 }}>
        <Button
          variant="contained"
          color="warning"
          onClick={() => {
            navigate('/employee')
          }}
          startIcon={<PersonAdd />}
        >
          {t('misc_create_employee')}
        </Button>
      </Box>
      {!checkPrivileges('getEmployees', user?.role) ? (
        <Typography color={'error.main'} variant="h6" align="center">
          {t('srv_no_permission')}
        </Typography>
      ) : (
        <>
          <SearchBar
            defaultSearch={search}
            handleSearchChange={handleSearchChange}
            debounced
            placeholder={`${t('misc_to_search')
              } ${t('misc_full_name')}, ${t('misc_telephone')}, ${t(
                'misc_email'
              )} ...`}
          />
          <ReactTable loading={isLoading || isFetching} items={data || []} />
          <DialogEmployeesFilter />
        </>
      )}
    </Stack>
  )
}
