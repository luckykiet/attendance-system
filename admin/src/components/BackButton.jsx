import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useTranslation from '@/hooks/useTranslation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

export default function BackButton({ sx, text, isSmallButton = false, ...props }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length <= 1) {
      navigate('/', { replace: true });
    } else {
      navigate(-1);
    }
  };

  return isSmallButton ? (
    <IconButton
      size="large"
      edge="start"
      color="warning"
      sx={{ mr: 2 }}
      onClick={handleBack}
    >
      <ArrowBackIcon />
    </IconButton>
  ) : (
    <Button
      sx={{ ...sx }}
      startIcon={<ArrowBackIosIcon />}
      variant="contained"
      color="warning"
      onClick={handleBack}
      size="small"
      {...props}
    >
      {text ? text : t('misc_back')}
    </Button>
  );
}

BackButton.propTypes = {
  sx: PropTypes.object,
  text: PropTypes.string,
  isSmallButton: PropTypes.bool,
};
