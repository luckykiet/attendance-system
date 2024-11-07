import { Navigate, useLocation } from 'react-router-dom';

import { GuardProps } from '@/types/auth';
import Loader from '@/components/Loader';
import useAuthApi from '@/api/useAuthApi';
import { useAuthStoreActions } from '@/stores/auth';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// ==============================|| AUTH GUARD ||============================== //

const AuthGuard = ({ children }: GuardProps) => {
  const { login, logout } = useAuthStoreActions();
  const { checkAuth } = useAuthApi();
  const location = useLocation();

  const {
    isLoading,
    isFetching,
    error,
    isError,
    data: authentication
  } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: () => checkAuth(),
    refetchOnMount: 'always'
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

  return authentication?.isAuthenticated ? (
    children
  ) : (
    <Navigate to={`/login`} state={{ from: location.pathname ? location.pathname : '' }} replace />
  );
};

export default AuthGuard;
