import {
  Container,
  Stack,
  Typography,
} from '@mui/material'
import useTranslation from '@/hooks/useTranslation'
import SignupForm from './forms/SignupForm'

export default function RegisterPage() {
  const { t } = useTranslation()

  return (
    <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" gutterBottom align="center">
          {t('msg_registration_form')}
        </Typography>
        <SignupForm />
      </Stack>
    </Container>
  )
}
