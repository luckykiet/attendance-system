import { Container, Grid2, Stack, Typography } from '@mui/material'
import { CONFIG } from '@/configs'
import { useQuery } from '@tanstack/react-query'
import { fetchRetail } from '@/api/retail'
import { useTranslation } from 'react-i18next'
import { fetchRegisters } from '@/api/registers'

export default function HomePage() {
  const { t } = useTranslation()

  const retailQuery = useQuery({
    queryKey: ['retail'],
    queryFn: () => fetchRetail(),
  })

  const { data: retail } = retailQuery;

  const registersQuery = useQuery({
    queryKey: ['registers'],
    queryFn: () => fetchRegisters(),
  })

  const { data: registers } = registersQuery;

  return (
    <Container sx={{ mb: 4, pt: 6 }}>
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>
          {retail ? <Stack spacing={2}>
            <Typography align="center" variant="h3" gutterBottom>
              {retail.name}
            </Typography>
            <Typography align="center" variant="h4" gutterBottom>
              {t('misc_tin')}: {retail.tin}
            </Typography>
          </Stack> :
            <Typography align="center" variant="h3" gutterBottom>
              {CONFIG.APP_NAME}
            </Typography>
          }
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          {registers && registers.length ?
            <Stack spacing={2}>
              <Typography align="center" variant="h5" gutterBottom>
                {t('misc_registers')}
              </Typography>
              <Stack spacing={1}>
                {registers.map((register, index) => (
                  <Typography key={index} align="center" variant="h6" gutterBottom>
                    {register.name}
                  </Typography>
                ))}
              </Stack>
            </Stack> :
            <Typography align="center" variant="h5" gutterBottom>
              {t('misc_no_registers')}
            </Typography>
          }
        </Grid2>
      </Grid2>
    </Container>
  )
}
