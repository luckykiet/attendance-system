import Loader from '@/components/Loader';
import { Navigate } from 'react-router-dom';
import { checkAuth } from '@/api/auth';
import { useAuthStoreActions } from '@/stores/auth';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';

const GuestGuard = ({ children }) => {
  const { login, logout } = useAuthStoreActions();
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
        queryClient.clear();
        logout();
      }
    }
  }, [authentication, login, logout, queryClient]);

  if (isLoading || isFetching) {
    return <Loader />;
  }

  return authentication?.isAuthenticated ? <Navigate to="/" replace /> : children;
};

GuestGuard.propTypes = {
  children: PropTypes.node,
};

export default GuestGuard;
