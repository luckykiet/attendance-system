import { Container, Typography } from '@mui/material'
import { CONFIG } from '@/configs'

export default function HomePage() {

  return (
    <Container sx={{ mb: 4, pt: 6 }}>
      <Typography align="center" variant="h3" gutterBottom>
        {CONFIG.APP_NAME}
      </Typography>
    </Container>
  )
}
