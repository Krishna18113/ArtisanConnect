import api from './axiosConfig';

export const register = (data) => {
  return api.post('/register', data);
};

export const login = (data) => {
  return api.post('/login', data);
};

export const googleLogin = (id_token) => {
  return api.post('/auth/google', { id_token });
};

export const getProfile = () => {
  return api.get('/profile');
};

export const updateProfile = (profileData) => {
  return api.patch('/profile', profileData);
};

export const updateProfileLocation = (locationData) => {
  return api.patch('/profile/location', locationData);
};

export const verifyOtp = (data) => {
  return api.post('/verify-otp', data);
};

export const forgotPassword = (data) => {
  return api.post('/forgot-password', data);
};

export const resetPassword = (data) => {
  return api.post('/reset-password', data);
};

export const verifyPasswordResetOtp = (data) => {
  return api.post('/verify-password-reset-otp', data);
};

export const resendOtp = (email) => {
  return api.post('/resend-otp', { email });
};
