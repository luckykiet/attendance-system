import LoginRoutes from './LoginRoutes'
import MainRoutes from './MainRoutes'
import { createBrowserRouter } from 'react-router-dom'

export default function Router() {
  return createBrowserRouter([MainRoutes, LoginRoutes])
}
