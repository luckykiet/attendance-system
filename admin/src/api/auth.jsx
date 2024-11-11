import { Buffer } from 'buffer';
import axiosServices from '@/utils/axios';

const axios = axiosServices('/auth');

export const checkAuth = async () => {
  const { data } = await axios.post('/isAuthenticated');
  return data;
};

export const login = async (form) => {
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

export const signup = async (form) => {
  const { data } = await axios.post('/signup', form, {
    headers: {
      'Content-Type': 'application/json',
      recaptcha: form.recaptcha,
      action: 'signup',
    },
  });

  return data;
};

export const logout = async () => {
  const { data } = await axios.post('/signout');
  return data;
};

export const resetPassword = async (passwords) => {
  const { password, confirmPassword, token } = passwords
  const modifiedData = {
    newPassword: password,
    confirmNewPassword: confirmPassword,
  }
  const {
    data: { success, msg },
  } = await axios.put(
    `/reset-password`,
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

export const forgotPassword = async (email) => {
  const {
    data: { success, msg },
  } = await axios.post(`/forgot-password`, { email })
  if (!success) {
    throw new Error(msg)
  }
  return msg
};

export const checkChangePasswordToken = async (token) => {
  const {
    data: { success, msg },
  } = await axios.get(`/forgot-password`, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
  if (!success) {
    throw new Error(msg)
  }

  return msg
};