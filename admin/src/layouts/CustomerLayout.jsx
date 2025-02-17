import BottomBar from '@/components/BottomBar'
import { Container } from '@mui/material'
import LeftDrawer from '@/components/LeftDrawer'
import { Outlet } from 'react-router-dom'
import RootLayout from './RootLayout'
import TopBarCustomer from '@/components/TopBarCustomer'
import { useEffect } from 'react'
import { useConfigStore } from '@/stores/config'
import { defaultAppName } from '@/configs'

export default function CustomerLayout() {
  const config = useConfigStore();
  const appName = config.appName || defaultAppName
  const title = `${appName}`;

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <RootLayout>
      <LeftDrawer />
      <TopBarCustomer />
      <Container component={'main'} maxWidth="sm" sx={{ flexGrow: 1, py: 8 }}>
        <Outlet />
      </Container>
      <BottomBar />
    </RootLayout>
  )
}
