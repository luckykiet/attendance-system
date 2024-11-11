import AppBar from '@mui/material/AppBar'
import { CONFIG } from '@/configs'
import IconButton from '@mui/material/IconButton'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Link } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Link as RouterLink } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { useSetDrawerOpen } from '@/stores/ZustandStores'

export default function TopBarCustomer() {
  const setDrawerOpen = useSetDrawerOpen()

  return (
    <AppBar elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Link
            component={RouterLink}
            to={'/'}
            color={'inherit'}
            variant="h6"
            underline="none"
            sx={{ flexGrow: 1 }}
          >
            {CONFIG.APP_NAME}
          </Link>
        </Stack>
        <LanguageSwitcher />
      </Toolbar>
    </AppBar>
  )
}
