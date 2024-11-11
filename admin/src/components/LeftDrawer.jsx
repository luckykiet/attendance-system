import { CONFIG } from '@/configs'
import { useDrawerOpen, useSetDrawerOpen } from '@/stores/root'

import AppRegistrationIcon from '@mui/icons-material/AppRegistration'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// import DarkModeSwitch from '@/components/DarkModeSwitch'
// import Divider from '@mui/material/Divider'
import { Fragment } from 'react'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LoginIcon from '@mui/icons-material/Login'
import Stack from '@mui/material/Stack'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import { useNavigate } from 'react-router-dom'
import useTranslation from '@/hooks/useTranslation'

const DrawerItems = () => {
  const navigate = useNavigate()
  const setDrawerOpen = useSetDrawerOpen()
  const { t } = useTranslation()

  return (
    <Fragment>
      <ListItem>
        <ListItemButton
          onClick={() => {
            navigate('/login')
            setDrawerOpen(false)
          }}
        >
          <ListItemIcon>
            <LoginIcon />
          </ListItemIcon>
          <ListItemText primary={t('misc_login')} />
        </ListItemButton>
      </ListItem>
      <ListItem>
        <ListItemButton
          onClick={() => {
            navigate('/registration')
            setDrawerOpen(false)
          }}
        >
          <ListItemIcon>
            <AppRegistrationIcon />
          </ListItemIcon>
          <ListItemText primary={t('misc_registration')} />
        </ListItemButton>
      </ListItem>
    </Fragment>
  )
}

export default function LeftDrawer() {
  const [drawerOpen, setDrawerOpen] = [useDrawerOpen(), useSetDrawerOpen()]

  return (
    <SwipeableDrawer
      anchor="left"
      open={drawerOpen}
      onOpen={() => { }}
      onClose={() => setDrawerOpen(false)}
    >
      <Stack sx={{ width: 250, height: '100%' }} justifyContent="space-between">
        <List disablePadding>
          <ListItem sx={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
            <ListItemText primary={`${CONFIG.APP_NAME}™`} />
            <IconButton onClick={() => setDrawerOpen(false)}>
              <ChevronLeftIcon />
            </IconButton>
          </ListItem>
          <DrawerItems />
        </List>
        <List disablePadding>
          <ListItem>
            <ListItemText
              sx={{ textAlign: 'center' }}
              secondary={CONFIG.APP_NAME}
            />
          </ListItem>
        </List>
      </Stack>
    </SwipeableDrawer>
  )
}
