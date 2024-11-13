import BottomBar from '@/components/BottomBar'
import { CONFIG } from '@/configs'
import { Container } from '@mui/material'
import LeftDrawerAdmin from '@/components/admin/LeftDrawerAdmin'
import { Outlet } from 'react-router-dom'
import RootLayout from './RootLayout'
import { useEffect } from 'react'
import useTranslation from '@/hooks/useTranslation'

export default function MerchantLayout() {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${t('misc_manager')} | ${CONFIG.APP_NAME}`
  }, [t])

  return (
    <RootLayout>
      <LeftDrawerAdmin withBackButton />
      <Container
        component={'main'}
        sx={{
          flexGrow: 1,
          mb: 4,
          pt: 10,
        }}
        maxWidth={false}
      >
        <Outlet />
      </Container>
      <BottomBar />
    </RootLayout>
  )
}
