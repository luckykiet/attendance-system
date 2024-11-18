import AuthGuard from '@/layouts/AuthGuard'
import Loadable from '@/components/Loadable'
import MerchantLayout from '@/layouts/MerchantLayout'
import { lazy } from 'react'

const HomePage = Loadable(lazy(() => import('@/pages/admin/HomePage')))
const EmployeesPage = Loadable(lazy(() => import('@/pages/admin/EmployeesPage')))
const EmployeePage = Loadable(lazy(() => import('@/pages/admin/EmployeePage')))
const RegisterAttendancePage = Loadable(lazy(() => import('@/pages/admin/RegisterAttendance')))
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
        {
          path: 'employee',
          element: <EmployeePage />,
        },
        {
          path: 'employee/:employeeId',
          element: <EmployeePage />,
        },
        {
          path: 'employees',
          element: <EmployeesPage />,
        },
        {
          path: 'attendance/:registerId',
          element: <RegisterAttendancePage />,
        }
      ],
    },
  ],
}

export default MainRoutes
