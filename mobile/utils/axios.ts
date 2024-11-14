import axios from 'axios';
import { useAppStore } from '@/stores/useAppStore';

const createAxiosService = (serverUrl: string, route = '/api') => {
  const instance = axios.create({
    baseURL: `${serverUrl}${route}`,
    withCredentials: true,
  });

  instance.interceptors.request.use(
    (config) => {
      const { appId } = useAppStore.getState();
      config.headers['Content-Type'] = 'application/json';
      if (appId) {
        config.headers['App-Id'] = appId;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const msg = error.response?.data?.msg;
      if (status === 401) {
        return Promise.reject(msg || 'srv_unauthorized');
      } else if (status === 403) {
        return Promise.reject(msg || 'srv_forbidden');
      } else if (status === 404) {
        return Promise.reject(msg || 'srv_not_found');
      } else if (status === 409) {
        return Promise.reject(msg || 'srv_duplicate');
      } else if (status === 500) {
        return Promise.reject(msg || 'srv_server_error');
      }

      return Promise.reject(msg || 'Unknown error');
    }
  );

  return instance;
};

export default createAxiosService;
