import axios from 'axios';
import urlJoin from 'url-join';
import { useAppStore } from '@/stores/useAppStore';

const createAxiosService = ({
  serverUrl = '',
  route = '/api',
  timeout,
}: {
  serverUrl?: string;
  route?: string;
  timeout?: number;
} = {}) => {
  const baseURL = urlJoin(serverUrl, route);

  const instance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: timeout || 0,
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
      } else if (status === 302) {
        const redirectedUrl = error.response.headers.location;
        console.log("Redirected URL:", redirectedUrl);
        return redirectedUrl;
      }

      return Promise.reject(msg || 'Unknown error');
    }
  );

  return instance;
};

export default createAxiosService;
