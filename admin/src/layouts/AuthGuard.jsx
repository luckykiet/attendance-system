import { Navigate, useLocation } from 'react-router-dom';
import Loader from '@/components/Loader';
import { useAuthStoreActions } from '@/stores/auth';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { checkAuth } from '@/api/auth';
import { clearAllQueries } from '@/utils';

const AuthGuard = ({ children }) => {
  const { login, logout } = useAuthStoreActions();
  const location = useLocation();
  const queryClient = useQueryClient();

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
        clearAllQueries(queryClient)
        logout();
      }
    }
  }, [authentication, login, logout, queryClient]);

  if (isLoading || isFetching) {
    return <Loader />;
  }

  return authentication?.isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location.pathname || '' }} replace />
  );
};

AuthGuard.propTypes = {
  children: PropTypes.node
};

export default AuthGuard;
