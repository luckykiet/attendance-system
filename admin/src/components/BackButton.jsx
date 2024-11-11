import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { Button } from '@mui/material'
import { capitalizeFirstLetterOfString } from '@/utils'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types';
export default function BackButton({ sx, text }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Button
      sx={{ ...sx, mb: 3 }}
      startIcon={<ArrowBackIosIcon />}
      variant="contained"
      color="warning"
      onClick={() => navigate(-1)}
    >
      {text ? text : capitalizeFirstLetterOfString(t('misc_back'))}
    </Button>
  )
}

BackButton.propTypes = {
  sx: PropTypes.object,
  text: PropTypes.string,
}
