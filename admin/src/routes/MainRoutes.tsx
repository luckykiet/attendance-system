import { RouteObject } from 'react-router';

import AuthGuard from '@/utils/route-guard/AuthGuard';
import CommonLayout from '@/layouts/CommonLayout';
import Loadable from '@/components/Loadable';
import MainLayout from '@/layouts/MainLayout';
import { lazy } from 'react';

const MaintenanceError = Loadable(lazy(() => import('@/pages/maintenance/error/ErrorPage')));

const MaintenanceUnderConstruction = Loadable(lazy(() => import('@/pages/maintenance/under-construction/under-construction')));

const HomePage = Loadable(lazy(() => import('@/pages/authenticated/home')));

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes: RouteObject = {
  path: '/',
  errorElement: <MaintenanceError />,
  element: (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: '',
      element: <HomePage />
    },
    {
      path: 'maintenance',
      element: <CommonLayout />,
      children: [
        {
          path: '404',
          element: <MaintenanceError />
        },
        {
          path: '500',
          element: <MaintenanceError />
        },
        {
          path: 'under-construction',
          element: <MaintenanceUnderConstruction />
        }
      ]
    }
  ]
};

export default MainRoutes;
