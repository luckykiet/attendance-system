import AuthGuard from '@/layouts/AuthGuard'
import Loadable from '@/components/Loadable'
import MerchantLayout from '@/layouts/MerchantLayout'
import { lazy } from 'react'

const HomePage = Loadable(lazy(() => import('@/pages/admin/HomePage')))
const ErrorPage = Loadable(lazy(() => import('@/pages/ErrorPage')))

const MainRoutes = {
  path: '/',
  errorElement: <ErrorPage />,
  children: [
    {
      path: '/',
      element: (
        <AuthGuard>
          <MerchantLayout />
        </AuthGuard>
      ),
      children: [
        {
          path: '',
          element: <HomePage />,
        },
      ],
    },
  ],
}

export default MainRoutes
