import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      console.log('AuthContext useEffect: token', token);
      console.log('AuthContext useEffect: savedUser', savedUser);
      if (token && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser({ ...parsedUser, token }); // Combine parsed user with token
        console.log('AuthContext useEffect: User set from localStorage');
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      console.log('AuthContext login: Attempting login for', email);
      const res = await authService.login({ email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      const userWithToken = { ...userData, token }; // Add token to user object
      console.log('AuthContext login: Saving userWithToken to localStorage:', userWithToken);
      localStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      toast({ title: 'Login Successful', description: `Welcome back, ${userData.name}!` });
      console.log('AuthContext login: Login successful');
      return { success: true };
    } catch (err) {
      console.error('AuthContext login: Login failed', err);
      toast({ title: 'Login Failed', description: err.response?.data?.msg || 'Invalid credentials', variant: 'destructive' });
      return { success: false, message: err.response?.data?.msg || 'Invalid credentials' };
    }
  };

  

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      // Backend now sends a message, not token directly
      toast({ title: 'Registration Initiated', description: res.data.msg || 'OTP sent to your email.' });
      return { success: true, message: res.data.msg };
    } catch (err) {
      toast({ title: 'Registration Failed', description: err.response?.data?.msg || 'An error occurred', variant: 'destructive' });
      return { success: false, message: err.response?.data?.msg || 'An error occurred' };
    }
  };

  const resendOtp = async (email) => {
  try {
    const res = await authService.resendOtp(email);
    toast({
      title: 'OTP Resent',
      description: res.data.msg || 'New OTP sent to your email',
    });
    return { success: true, message: res.data.msg };
  } catch (err) {
    toast({
      title: 'Resend Failed',
      description: err.response?.data?.msg || 'Could not resend OTP',
      variant: 'destructive',
    });
    return { success: false };
  }
};


  const verifyOtp = async (email, otp, role) => {
    try {
      const res = await authService.verifyOtp({ email, otp, role });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      const userWithToken = { ...userData, token }; // Add token to user object
      console.log('AuthContext: Saving userWithToken to localStorage:', userWithToken);
      localStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      toast({ title: 'Verification Successful', description: res.data.msg || 'Your email has been verified!' });
      return { success: true, message: res.data.msg };
    } catch (err) {
      toast({ title: 'Verification Failed', description: err.response?.data?.msg || 'Invalid OTP or OTP expired.', variant: 'destructive' });
      return { success: false, message: err.response?.data?.msg || 'Invalid OTP or OTP expired.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({ title: 'Logged Out' });
  };

  const value = {
  user,
  isAuthenticated: !!user,
  login,
  register,
  resendOtp,   // 👈 ADD THIS
  logout,
  verifyOtp,
};


  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
