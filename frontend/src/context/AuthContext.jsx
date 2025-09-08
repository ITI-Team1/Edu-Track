/* eslint react-refresh/only-export-components: off */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const data = await apiService.login(credentials);
    const userData = await apiService.getCurrentUser();
    setUser(userData);
    return data;
  };

  const refreshUser = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } catch {
      // silent
    }
  };

  const register = async (userData) => {
    const data = await apiService.register(userData);
    return data;
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    // Navigate to home page after logout
    window.location.href = '/';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  refreshUser,
  isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 