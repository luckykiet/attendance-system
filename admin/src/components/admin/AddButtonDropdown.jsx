import { Button, Menu } from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import PostAddIcon from '@mui/icons-material/PostAdd'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import useTranslation from '@/hooks/useTranslation'

export default function AddButtonDropdown() {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const navigate = useNavigate()

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
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
          <MenuItem
            onClick={() => {
              navigate('/company/add')
              handleClose()
            }}
          >
            <ListItemIcon>
              <PostAddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t('misc_new_form')}
            </ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  )
}
