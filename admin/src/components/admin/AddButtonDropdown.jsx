import { Button, Menu } from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import React from 'react'
import useTranslation from '@/hooks/useTranslation'
import { useSetIsModalOpen as useSetIsRegisterModalOpen, useSetRegisterId } from '@/stores/register'
import { useAuthStore } from '@/stores/auth'
import { checkPrivileges } from '@/utils'
import { AddBusiness, GroupAdd } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function AddButtonDropdown() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const setIsRegisterModalOpen = useSetIsRegisterModalOpen()
  const setRegisterId = useSetRegisterId()
  const navigate = useNavigate()

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleAddRegister = () => {
    navigate('/')
    setRegisterId('')
    setIsRegisterModalOpen(true)
    handleClose()
  }

  return (
    <>
      <Button
        size="small"
        color="success"
        startIcon={<AddIcon />}
        sx={{ mr: 2 }}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        variant="contained"
        id="basic-button"
      >
        {t('misc_add')}
      </Button>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        sx={{ mt: 0.5, minWidth: 320, maxWidth: '100%', height: 'auto' }}
      >
        <MenuList>
          {checkPrivileges('addRegister', user?.role) && <MenuItem
            onClick={handleAddRegister}
          >
            <ListItemIcon>
              <AddBusiness />
            </ListItemIcon>
            <ListItemText>
              {t('misc_add_workplace')}
            </ListItemText>
          </MenuItem>}
          {checkPrivileges('addEmployee', user?.role) && <MenuItem
            onClick={() => {
              navigate('/employee')
              handleClose()
            }}
          >
            <ListItemIcon>
              <GroupAdd />
            </ListItemIcon>
            <ListItemText>
              {t('misc_create_employee')}
            </ListItemText>
          </MenuItem>}
          {checkPrivileges('createUser', user?.role) && <MenuItem
            onClick={() => {
              navigate('/user')
              handleClose()
            }}
          >
            <ListItemIcon>
              <PersonAddIcon />
            </ListItemIcon>
            <ListItemText>
              {t('misc_create_user')}
            </ListItemText>
          </MenuItem>}
        </MenuList>
      </Menu>
    </>
  )
}
