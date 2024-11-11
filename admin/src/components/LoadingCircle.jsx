import CircularProgress from '@mui/material/CircularProgress'
import { Container } from '@mui/material'

export default function LoadingCircle() {
  return (
    <Container
      component={'span'}
      sx={{ display: 'flex', justifyContent: 'center' }}
    >
      <CircularProgress />
    </Container>
  )
}
