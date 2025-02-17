import { Fragment, useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import BottomBar from '@/components/BottomBar'
import { defaultAppName } from '@/configs'
import Container from '@mui/material/Container'
import LeftDrawer from '@/components/LeftDrawer'
import { Paper } from '@mui/material'
import TopBarCustomer from '@/components/TopBarCustomer'
import Typography from '@mui/material/Typography'
import useTranslation from '@/hooks/useTranslation'
import { useConfigStore } from '@/stores/config'

export default function ErrorPage() {
  const error = useRouteError()
  const { t } = useTranslation()
  const config = useConfigStore()
  console.error(error)
  const title = `${t('srv_word')} | ${config.appName || defaultAppName}`
  
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <Fragment>
      <LeftDrawer />
      <TopBarCustomer />
      <Container component="main" maxWidth="xl" sx={{ mb: 4, pt: 10 }}>
        <Paper elevation={3} sx={{ my: { xs: 1, md: 6 }, p: { xs: 2, md: 3 } }}>
          <Typography variant="h3" gutterBottom>
            {t('srv_word')}
          </Typography>
          <Typography variant="h5" noWrap gutterBottom>
            <RootBoundary />
          </Typography>
        </Paper>
      </Container>
      <BottomBar />
    </Fragment>
  )
}

function RootBoundary() {
  const error = useRouteError()
  const { t } = useTranslation()

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <Fragment>
          {t('srv_word')} {error.status} - {t('srv_page_not_found')}!
        </Fragment>
      )
    }

    if (error.status === 401) {
      return (
        <Fragment>
          {t('srv_word')} {error.status} - {t('srv_no_permission')}!
        </Fragment>
      )
    }

    if (error.status === 503) {
      return (
        <Fragment>
          {t('srv_word')} {error.status} - {t('srv_failed_api')}!
        </Fragment>
      )
    }

    if (error.status === 418) {
      return <Fragment>🫖</Fragment>
    }
  }

  return <Fragment>{error.statusText || error.message}</Fragment>
}
