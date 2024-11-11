import { Button, Container, Grid2, Stack, Typography } from '@mui/material'
import { CONFIG } from '@/configs'
import { useQuery } from '@tanstack/react-query'
import { fetchRetail } from '@/api/retail'
import useTranslation from '@/hooks/useTranslation'
import { fetchRegisters } from '@/api/registers'
import { Box } from '@mui/system'
import DialogRegister from '@/components/admin/DialogRegister'
import { useSetIsModalOpen, useSetRegisterId } from '@/stores/register'
import { useEffect } from 'react'
import { useSetRetail } from '@/stores/root'

export default function HomePage() {
  const { t } = useTranslation()
  const setRegisterId = useSetRegisterId()
  const setRegisterIsModalOpen = useSetIsModalOpen()
  const setRetail = useSetRetail()

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

  const handleCreateNewRegister = () => {
    setRegisterId('')
    setRegisterIsModalOpen(true)
  }

  useEffect(() => {
    if (retail) {
      setRetail(retail)
    }
  }, [retail, setRetail])

  return (
    <Container sx={{ mb: 4, pt: 6 }}>
      <Grid2 container spacing={2}>
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
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button variant='contained' onClick={handleCreateNewRegister}>
              {t('misc_new_company')}
            </Button>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <DialogRegister />
          {registers && registers.length ?
            <Stack spacing={2}>
              <Typography align="center" variant="h5" gutterBottom>
                {t('misc_companies')}: {registers.length}
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
              {t('misc_no_company')}
            </Typography>
          }
        </Grid2>
      </Grid2>
    </Container>
  )
}
