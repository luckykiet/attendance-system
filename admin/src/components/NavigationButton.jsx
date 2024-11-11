import { Box, Popover } from '@mui/material'

import { IconButton } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ReplyIcon from '@mui/icons-material/Reply'
import { useState } from 'react'
import PropTypes from 'prop-types';

export default function NavigationButton({
  icon,
  openingIcon,
  content,
  position = 'rightBottom',
  sx = {},
}) {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  const classes =
    position === 'leftTop'
      ? { top: 80, left: 10 }
      : position === 'leftBottom'
      ? { bottom: 10, left: 10 }
      : position === 'rightTop'
      ? { top: 80, right: 10 }
      : position === 'rightBottom'
      ? { bottom: 10, right: 10 }
      : { bottom: 10, right: 10 }

  const anchorOrigin =
    position === 'leftTop'
      ? {
          vertical: 'bottom',
          horizontal: 'right',
        }
      : position === 'leftBottom'
      ? {
          vertical: 'top',
          horizontal: 'center',
        }
      : position === 'rightTop'
      ? {
          vertical: 'bottom',
          horizontal: 'left',
        }
      : position === 'rightBottom'
      ? {
          vertical: 'bottom',
          horizontal: 'right',
        }
      : {
          vertical: 'bottom',
          horizontal: 'right',
        }

  const anchorTransform =
    position === 'leftTop'
      ? {
          vertical: 'top',
          horizontal: 'left',
        }
      : position === 'leftBottom'
      ? {
          vertical: 'bottom',
          horizontal: 'left',
        }
      : position === 'rightTop'
      ? {
          vertical: 'top',
          horizontal: 'right',
        }
      : position === 'rightBottom'
      ? {
          vertical: 'top',
          horizontal: 'center',
        }
      : {
          vertical: 'top',
          horizontal: 'center',
        }

  return (
    <>
      <IconButton
        size="large"
        sx={{
          ...sx,
          ...classes,
          zIndex: 9998,
          position: 'fixed',
          backgroundColor: (theme) => theme.palette.grey[100],
        }}
        onClick={handleClick}
      >
        {!anchorEl ? (
          icon ? (
            icon
          ) : (
            <MenuIcon />
          )
        ) : openingIcon ? (
          openingIcon
        ) : (
          <ReplyIcon />
        )}
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ ...anchorOrigin }}
        transformOrigin={{ ...anchorTransform }}
        onClose={handleClose}
        disableScrollLock
        sx={{ zIndex: 9999 }}
      >
        <Box
          sx={{
            border: 1,
            borderRadius: 1,
            py: 1,
            px: 3,
            bgcolor: 'background.paper',
          }}
        >
          {content}
        </Box>
      </Popover>
    </>
  )
}
NavigationButton.propTypes = {
  icon: PropTypes.element,
  openingIcon: PropTypes.element,
  content: PropTypes.element,
  position: PropTypes.string,
  sx: PropTypes.object,
}