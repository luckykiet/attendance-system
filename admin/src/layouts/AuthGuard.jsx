import { Navigate, useLocation } from 'react-router-dom'

import Loader from '@/components/Loader'
import TimerAlert from '@/components/TimerAlert'
import useAuthApi from '@/api/useAuthApi'
import { useAuthStoreActions } from '@/stores/AuthStores'
import { useEffect } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useMutation } from '@tanstack/react-query'
import PropTypes from 'prop-types';

const AuthGuard = ({ children }) => {
  const { login, logout } = useAuthStoreActions()
  const { checkAuthentication } = useAuthApi()
  const location = useLocation()
  const [token, setToken] = useLocalStorage('user-token', null)

  const checkAuthMutation = useMutation({
    mutationKey: ['authGuard'],
    mutationFn: () => checkAuthentication(),
    onSuccess: (authentication) => {
      const { isAuthenticated, token: authToken } = authentication
      if (isAuthenticated) {
        login(authentication)
        setToken(authToken)
      } else {
        logout()
        setToken(null)
      }
    },
    onError: () => {
      setToken(null)
      logout()
    },
  })

  useEffect(() => {
    if (token && checkAuthMutation.isIdle) {
      checkAuthMutation.mutateAsync()
    }
  }, [token, checkAuthMutation])

  if (checkAuthMutation.isIdle || checkAuthMutation.isPending) {
    return <Loader />
  }

  return token ? (
    <>
      <TimerAlert />
      {children}
    </>
  ) : (
    <Navigate
      to={'/login'}
      state={{ from: location.pathname || '' }}
      replace
    />
  )
}

export default AuthGuard

AuthGuard.propTypes = {
  children: PropTypes.node,
}
