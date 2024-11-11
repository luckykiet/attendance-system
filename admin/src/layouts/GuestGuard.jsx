import Loader from '@/components/Loader'
import { Navigate } from 'react-router-dom'
import useAuthApi from '@/api/useAuthApi'
import { useAuthStoreActions } from '@/stores/AuthStores'
import { useEffect } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { useMutation } from '@tanstack/react-query'
import PropTypes from 'prop-types';

const GuestGuard = ({ children }) => {
  const { login, logout } = useAuthStoreActions()
  const { checkAuthentication } = useAuthApi()
  const [token, setToken] = useLocalStorage('user-token', null)

  const checkAuthMutation = useMutation({
    mutationKey: ['guestGuard'],
    mutationFn: () => checkAuthentication(),
    onSuccess: (authentication) => {
      const { isAuthenticated, token: authToken } = authentication
      if (isAuthenticated) {
        login(authentication)
        setToken(authToken)
      } else {
        logout()
      }
    },
    onError: () => {
      setToken(null)
    },
  })

  useEffect(() => {
    if (checkAuthMutation.isIdle) {
      checkAuthMutation.mutateAsync()
    }
  }, [checkAuthMutation])

  if (checkAuthMutation.isIdle || checkAuthMutation.isPending) {
    return <Loader />
  }

  return token ? <Navigate to={'/'} replace /> : children
}

export default GuestGuard

GuestGuard.propTypes = {
  children: PropTypes.node,
}