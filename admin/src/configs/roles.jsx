import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import { useTheme } from '@mui/material'
export const ROLES = ['Admin', 'Manager']
export const useRoles = () => {
  const theme = useTheme()
  return [
    {
      key: ROLES[0],
      name: 'admin',
      color: theme.palette.error.main,
      icon: SupervisorAccountIcon,
    },
    {
      key: ROLES[1],
      name: 'misc_manager',
      color: theme.palette.warning.main,
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
