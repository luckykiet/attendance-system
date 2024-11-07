import { GuardProps } from '@/types/auth';
import Loader from '@/components/Loader';
import { Navigate } from 'react-router-dom';
import useAuthApi from '@/api/useAuthApi';
import { useAuthStoreActions } from '@/stores/auth';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// ==============================|| GUEST GUARD ||============================== //

const GuestGuard = ({ children }: GuardProps) => {
  const { login, logout } = useAuthStoreActions();
  const { checkAuth } = useAuthApi();

  const {
    isLoading,
    isFetching,
    error,
    isError,
    data: authentication
  } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: () => checkAuth()
  });

  if (isError) {
    console.log(error.message);
  }

  useEffect(() => {
    if (authentication) {
      const { isAuthenticated } = authentication;
      if (isAuthenticated) {
        login(authentication);
      } else {
        logout();
      }
    }
  }, [authentication, login, logout]);

  if (isLoading || isFetching) {
    return <Loader />;
  }

  return authentication?.isAuthenticated ? <Navigate to={'/'} replace /> : children;
};

export default GuestGuard;
