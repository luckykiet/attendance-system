import { ForgotPasswordFormMutation, LoginFormMutation, ResetPasswordFormMutation, SignupFormMutation } from '@/types/forms/auth';
import axiosServices from '@/utils/axios';
import { Buffer } from 'buffer';

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

  const login = async (form: LoginFormMutation) => {
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

  const signup = async (form: SignupFormMutation) => {
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

  const resetPassword = async (formData: ResetPasswordFormMutation) => {
    const { data } = await axios.post('/resetPassword', formData);
    return data;

  };

  const forgotPassword = async (formData: ForgotPasswordFormMutation) => {
    const { data } = await axios.post('/forgotPassword', formData);
    return data;
  };

  return { checkAuth, login, signup, logout, resetPassword, forgotPassword };
};

export default useAuthApi;
