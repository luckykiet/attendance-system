import { Buffer } from 'buffer';
import axiosServices from '@/utils/axios';

const useAuthApi = () => {
  const axios = axiosServices('/auth');

  const checkAuth = async () => {
    try {
      const { data } = await axios.post('/isAuthenticated');
      return data;
    } catch (error) {
      console.error('Error checking authentication:', error);
      throw error;
    }
  };

  const login = async (form) => {
    const password = Buffer.from(form.password).toString('base64');
    const { data } = await axios.post('/login', {
      username: form.username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        recaptcha: form.recaptcha,
        action: 'login',
      },
    });
    return data;
  };

  const signup = async (form) => {
    const { data } = await axios.post('/signup', form, {
      headers: {
        'Content-Type': 'application/json',
        recaptcha: form.recaptcha,
        action: 'signup',
      },
    });
    return data;
  };

  const logout = async () => {
    const { data } = await axios.get('/signout');
    return data;
  };

  const resetPassword = async (passwords) => {
    const { password, confirmPassword, token } = passwords
    const modifiedData = {
      newPassword: password,
      confirmNewPassword: confirmPassword,
    }
    const {
      data: { success, msg },
    } = await axios.put(
      `auth/reset-password`,
      JSON.stringify(modifiedData),
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      }
    )

    if (!success) {
      throw new Error(msg)
    }
    return msg
  };

  const forgotPassword = async (formData) => {
    const {
      data: { success, msg },
    } = await axios.post(
      `/auth/forgot-password`,
      formData
    )
    if (!success) {
      throw new Error(msg)
    }
    return msg
  };
  return { checkAuth, login, signup, logout, resetPassword, forgotPassword };
};

export default useAuthApi;
