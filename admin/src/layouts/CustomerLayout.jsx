import BottomBar from '@/components/BottomBar'
import { CONFIG } from '@/configs'
import { Container } from '@mui/material'
import LeftDrawer from '@/components/LeftDrawer'
import { Outlet } from 'react-router-dom'
import RootLayout from './RootLayout'
import TopBarCustomer from '@/components/TopBarCustomer'
import { useEffect } from 'react'

export default function CustomerLayout() {
  useEffect(() => {
    document.title = `${CONFIG.APP_NAME}`
  }, [])
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
