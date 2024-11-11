import CustomerLayout from '@/layouts/CustomerLayout'
import GuestGuard from '@/layouts/GuestGuard'
import Loadable from '@/components/Loadable'
import { lazy } from 'react'

const Home = Loadable(lazy(() => import('@/pages/HomePage')))
const AuthLogin = Loadable(lazy(() => import('@/pages/auth/LoginPage')))
const AuthForgotPassword = Loadable(lazy(() => import('@/pages/auth/ForgottenPasswordPage')))
const AuthRegister = Loadable(lazy(() => import('@/pages/auth/RegisterPage')))
const AuthResetPassword = Loadable(lazy(() => import('@/pages/auth/RenewPasswordPage')))

const ErrorPage = Loadable(lazy(() => import('@/pages/ErrorPage')))

const LoginRoutes = {
  path: '/',
  errorElement: <ErrorPage />,
  children: [
    {
      path: '/',
      element: (
        <GuestGuard>
          <CustomerLayout />
        </GuestGuard>
      ),
      children: [
        {
          path: '',
          element: <Home />,
        },
        {
          path: 'login',
          element: <AuthLogin />,
        },
        {
          path: 'signup',
          element: <AuthRegister />,
        },
        {
          path: 'forgot-password',
          element: <AuthForgotPassword />,
        },
      ],
    },
    {
      element: <CustomerLayout />,
      path: '/',
      children: [
        {
          path: 'reset-password/:token',
          element: <AuthResetPassword />,
        },
      ],
    },
  ],
}

export default LoginRoutes
