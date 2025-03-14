import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { IconButton } from '@mui/material'
import { useState } from 'react'
import PropTypes from 'prop-types';

export default function CopyButton({
  value,
  color = 'primary',
  edge = 'start',
}) {
  const [copied, setCopied] = useState(false)

  return (
    <IconButton
      color={color}
      edge={edge}
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
      }}
    >
      {copied ? <CheckIcon /> : <ContentCopyIcon />}
    </IconButton>
  )
}

CopyButton.propTypes = {
  value: PropTypes.string.isRequired,
  color: PropTypes.string,
  edge: PropTypes.string,
}