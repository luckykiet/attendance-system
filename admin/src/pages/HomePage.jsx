import { Button, Container, Stack, Typography } from '@mui/material'
import { CONFIG } from '@/configs'

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Container sx={{ mb: 4, pt: 6 }}>
      <Typography align="center" variant="h3" gutterBottom>
        {CONFIG.APP_NAME}
      </Typography>
      <Stack spacing={2}>
        <Button
          size="large"
          variant="contained"
          onClick={() => navigate('/login')}
        >
          {t('misc_login')}
        </Button>
        <Button
          onClick={() => navigate('/signup')}
          variant="contained"
          size="large"
          color="success"
        >
          {t('misc_registration')}
        </Button>
      </Stack>
    </Container>
  )
}
