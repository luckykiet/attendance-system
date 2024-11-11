import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import { useTheme } from '@mui/material'

export const useRoles = () => {
  const theme = useTheme()
  return [
    {
      key: 'Admin',
      name: 'admin',
      color: theme.palette.error.main,
      order: 1,
      icon: SupervisorAccountIcon,
    },
    {
      key: 'Manager',
      name: 'misc_manager',
      color: theme.palette.warning.main,
      order: 3,
      icon: ManageAccountsIcon,
    },
  ]
}

export const useRolesObject = () => {
  const role = useRoles()
  return role.reduce((acc, s) => {
    acc[s.key] = { ...s }
    return acc
  }, {})
}
