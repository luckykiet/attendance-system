import { ListSubheader } from '@mui/material'
import PropTypes from 'prop-types';

export default function SelectListSubheader(props) {
  // eslint-disable-next-line no-unused-vars
  const { muiSkipListHighlight, ...other } = props

  return <ListSubheader {...other} />
}
SelectListSubheader.propTypes = {
  muiSkipListHighlight: PropTypes.bool,
}