import axios from 'axios'

const axiosServices = (route = '/mod') => {
  const instance = axios.create({
    baseURL: route,
    withCredentials: true
  });

  instance.interceptors.request.use(
    (response) => {
      response.headers['Content-Type'] = 'application/json'
      return response
    }
  )

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        return Promise.reject('srv_unauthorized')
      } else if (error.response?.status === 403) {
        return Promise.reject('srv_forbidden')
      } else if (error.response?.status === 404) {
        return Promise.reject('srv_not_found')
      } else if (error.response?.status === 409) {
        return Promise.reject('srv_duplicate')
      } else if (error.response?.status === 500) {
        return Promise.reject('srv_server_error')
      }

      return Promise.reject(
        error?.response && error.response?.data
          ? error.response.data.msg
            ? error.response.data.msg
            : error.response.data
          : 'Wrong Services'
      )
    }
  );

  return instance;
};

export default axiosServices;