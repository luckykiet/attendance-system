import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types';
import useTranslation from '@/hooks/useTranslation'
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
      {text ? text : t('misc_back')}
    </Button>
  )
}

BackButton.propTypes = {
  sx: PropTypes.object,
  text: PropTypes.string,
}
