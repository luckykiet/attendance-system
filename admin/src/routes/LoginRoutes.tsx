import CommonLayout from '@/layouts/CommonLayout';
import GuestGuard from '@/utils/route-guard/GuestGuard';
import Loadable from '@/components/Loadable';
import { RouteObject } from 'react-router';
import { lazy } from 'react';

const AuthLogin = Loadable(lazy(() => import('@/pages/auth/login')));
const AuthSignup = Loadable(lazy(() => import('@/pages/auth/signup')));
const MaintenanceError = Loadable(lazy(() => import('@/pages/maintenance/error/ErrorPage')));

// ==============================|| AUTH ROUTES ||============================== //

const LoginRoutes: RouteObject = {
  path: '/',
  errorElement: <MaintenanceError />,
  element: (
    <GuestGuard>
      <CommonLayout />
    </GuestGuard>
  ),
  children: [
    {
      path: 'login',
      element: <AuthLogin />
    },
    {
      path: 'signup',
      element: <AuthSignup />
    }
  ]
};

export default LoginRoutes;
