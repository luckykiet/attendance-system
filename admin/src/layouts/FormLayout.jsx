import BottomBar from '@/components/BottomBar'
import { CONFIG } from '@/configs'
import { Container } from '@mui/material'
import LeftDrawerAdmin from '@/components/admin/LeftDrawerAdmin'
import { Outlet } from 'react-router-dom'
import RootLayout from './RootLayout'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function FormLayout() {
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
        maxWidth={'xl'}
      >
        <Outlet />
      </Container>
      <BottomBar />
    </RootLayout>
  )
}
