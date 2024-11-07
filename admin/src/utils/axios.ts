import axios, { AxiosInstance } from 'axios';

const axiosServices = (route = '/mod'): AxiosInstance => {
  const instance = axios.create({
    baseURL: route,
    withCredentials: true
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        return Promise.reject('srv_unauthorized');
      }
      return Promise.reject(error.response?.data || 'Wrong Services');
    }
  );

  return instance;
};

export default axiosServices;
