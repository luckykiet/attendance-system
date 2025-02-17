import BottomBar from '@/components/BottomBar'
import { Container } from '@mui/material'
import LeftDrawerAdmin from '@/components/admin/LeftDrawerAdmin'
import { Outlet } from 'react-router-dom'
import RootLayout from './RootLayout'
import { useEffect } from 'react'
import useTranslation from '@/hooks/useTranslation'
import { useConfigStore } from '@/stores/config'
import { defaultAppName } from '@/configs'

export default function MerchantLayout() {
  const { t } = useTranslation()
  const config = useConfigStore()
  const appName = config.appName || defaultAppName
  const title = `${t('misc_manager')} | ${appName}`;

  useEffect(() => {
    document.title = title
  }, [title])

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
