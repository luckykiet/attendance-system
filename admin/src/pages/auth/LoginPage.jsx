import {
  Container,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import LoginForm from './forms/LoginForm'

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" gutterBottom align="center">
          {t('misc_login')}
        </Typography>
        <LoginForm />
      </Stack>
    </Container>
  )
}
