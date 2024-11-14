import { Box, Popover, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import React from 'react'

export default function CustomPopper({ content, buttonText, sx }) {
  const [anchorEl, setAnchorEl] = React.useState(null)

  const handleClick = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (e) => {
    e.stopPropagation()
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  return (
    <Box sx={sx} onClick={(e) => e.stopPropagation()}>
      <Typography
        variant="body1"
        sx={{
          textDecoration: 'underline',
          cursor: 'pointer',
          color: (theme) => theme.palette.primary.main,
        }}
        onClick={handleClick}
      >
        {buttonText}
      </Typography>
      <Popover
        disableScrollLock
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
    </Box>
  )
}

CustomPopper.propTypes = {
  content: PropTypes.node.isRequired,
  buttonText: PropTypes.string.isRequired,
  sx: PropTypes.object,
}