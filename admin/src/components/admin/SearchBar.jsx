import { IconButton, InputAdornment, TextField } from '@mui/material'
import { useEffect, useState } from 'react'

import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import PropTypes from 'prop-types';
export default function SearchBar({
  handleSearchChange,
  placeholder,
  debounced = false,
  defaultSearch = '',
  onEnter = null,
  endButton = null,
  startButton = null,
}) {
  const [search, setSearch] = useState(defaultSearch)
  useEffect(() => {
    if (debounced) {
      const delay = setTimeout(() => {
        handleSearchChange(search)
      }, 500)
      return () => {
        clearTimeout(delay)
      }
    } else {
      handleSearchChange(search)
    }
  }, [debounced, handleSearchChange, search])

  const handleClearClick = () => {
    setSearch('')
    handleSearchChange('')
  }

  return (
    <TextField
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {startButton ? startButton : <SearchIcon />}
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {endButton ? (
              endButton
            ) : (
              <IconButton
                disabled={search === ''}
                onClick={handleClearClick}
                color="error"
              >
                <ClearIcon />
              </IconButton>
            )}
          </InputAdornment>
        ),
      }}
      onKeyDown={(e) => {
        if (onEnter && e.key === 'Enter') {
          onEnter()
        }
      }}
      placeholder={placeholder}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      fullWidth
      variant="outlined"
    />
  )
}

SearchBar.propTypes = {
  handleSearchChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  debounced: PropTypes.bool,
  defaultSearch: PropTypes.string,
  onEnter: PropTypes.func,
  endButton: PropTypes.node,
  startButton: PropTypes.node,
}