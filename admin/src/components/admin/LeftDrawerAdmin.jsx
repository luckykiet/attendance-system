import {
  AppBar,
  Box,
  Button,
  Stack,
  SwipeableDrawer,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { CONFIG } from '@/configs'
import { capitalizeFirstLetterOfString, checkPrivileges } from '@/utils'
import { useDrawerOpen, useSetDrawerOpen } from '@/stores/root'
import PropTypes from 'prop-types';
import AddButtonDropdown from '@/components/admin/AddButtonDropdown'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { Home, Logout } from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth';
import { logout } from '@/api/auth';
import { useQueryClient } from '@tanstack/react-query';

const CustomListItem = ({ href, text, icon, reset }) => {
  const navigate = useNavigate()
  const setDrawerOpen = useSetDrawerOpen()

  return (
    <ListItem>
      <ListItemButton
        onClick={() => {
          setDrawerOpen(false)
          navigate(href)
          if (reset) {
            reset()
          }
        }}
      >
        <Tooltip title={text}>
          <ListItemIcon>{icon}</ListItemIcon>
        </Tooltip>
        <ListItemText primary={text} />
      </ListItemButton>
    </ListItem>
  )
}

CustomListItem.propTypes = {
  href: PropTypes.string,
  text: PropTypes.string.isRequired,
  icon: PropTypes.element,
  reset: PropTypes.func,
};

export default function LeftDrawerAdmin({ withBackButton = false }) {
  const { user } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = [useDrawerOpen(), useSetDrawerOpen()]
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const theme = useTheme()
  const media = useMediaQuery(theme.breakpoints.down('sm'))

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      queryClient.clear();
      navigate(`/login`, {
        state: {
          from: '',
        },
        replace: true,
      })
      handleDrawerClose()
    } catch (err) {
      console.error(err)
    }
  }

  const location = useLocation()

  const drawer = (
    <>
      <List disablePadding sx={{ display: 'block' }}>
        {checkPrivileges('getUsers', user?.role) && (
          <CustomListItem
            href={'/users'}
            text={t('misc_users')}
            icon={<PeopleIcon />}
          />
        )}
      </List>
      <Divider />
      <List disablePadding>
        <CustomListItem
          href={`/user/${user?.username}`}
          text={user?.username}
          icon={<PersonIcon />}
        />
        <ListItem>
          <ListItemButton onClick={handleLogout}>
            <Tooltip title={capitalizeFirstLetterOfString(t('misc_to_logout'))}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
            </Tooltip>
            <ListItemText
              primary={capitalizeFirstLetterOfString(t('misc_to_logout'))}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <List disablePadding sx={{ display: drawerOpen ? 'block' : 'none' }}>
        <Divider />
        <ListItem>
          <ListItemText
            sx={{
              textAlign: 'center',
            }}
            secondary={CONFIG.APP_NAME}
          />
        </ListItem>
      </List>
    </>
  )
  return (
    <AppBar position="fixed" open={drawerOpen}>
      <Toolbar>
        <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
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
          <AddButtonDropdown />
          {withBackButton &&
            location.key !== 'default' &&
            (media ? (
              <IconButton
                size="large"
                edge="start"
                color="warning"
                sx={{ mr: 2 }}
                onClick={() => navigate(-1)}
              >
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <Button
                size="small"
                color="warning"
                startIcon={<ArrowBackIosIcon />}
                sx={{ mr: 2 }}
                onClick={() => navigate(-1)}
                variant="contained"
              >
                {capitalizeFirstLetterOfString(t('misc_back'))}
              </Button>
            ))}
        </Box>
        <Stack spacing={1} direction={'row'}>
          <Tooltip title={capitalizeFirstLetterOfString(t('misc_home_page'))}>
            <IconButton
              onClick={() => {
                handleDrawerClose()
                navigate('/')
              }}
              size="large"
              edge="end"
              color="inherit"
            >
              <Home />
            </IconButton>
          </Tooltip>
          {checkPrivileges('getUsers', user?.role) && (
            <Tooltip title={capitalizeFirstLetterOfString(t('misc_users'))}>
              <IconButton
                onClick={() => {
                  handleDrawerClose()
                  navigate('/users')
                }}
                size="large"
                edge="end"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                <PeopleIcon />
              </IconButton>
            </Tooltip>
          )}

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          />
          <Tooltip title={user?.username}>
            <IconButton
              onClick={() => {
                handleDrawerClose()
                navigate(`/user/${user?.username}`)
              }}
              size="large"
              edge="end"
              color="inherit"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
          <LanguageSwitcher withText={false} />
          <Tooltip title={capitalizeFirstLetterOfString(t('misc_to_logout'))}>
            <IconButton
              onClick={handleLogout}
              size="large"
              edge="end"
              color="inherit"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Logout />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onOpen={() => { }}
        onClose={handleDrawerClose}
      >
        <List disablePadding>
          <ListItem sx={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
            <ListItemText primary={`${CONFIG.APP_NAME}`} />
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </ListItem>
        </List>
        {drawer}
      </SwipeableDrawer>
    </AppBar>
  )
}

LeftDrawerAdmin.propTypes = {
  withBackButton: PropTypes.bool,
};