import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasBudget, setHasBudget] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me/');
          setUser(response.data);
          
          // Check if user has a budget
          const budgetCheck = await apiClient.get('/budgets/check-exists/');
          setHasBudget(budgetCheck.data.hasBudget);
        } catch (err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setHasBudget(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Register new user
  const register = useCallback(async (username, email, firstName, lastName, password, passwordConfirm) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/register/', {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
      });

      const { user: userData, tokens } = response.data;
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      setUser(userData);
      setHasBudget(false); // New users don't have budgets

      return { success: true, data: userData };
    } catch (err) {
      const errorMsg = err.response?.data || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Login user
  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/login/', {
        username,
        password,
      });

      const { user: userData, tokens } = response.data;
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      setUser(userData);

      // Check if user has a budget
      const budgetCheck = await apiClient.get('/budgets/check-exists/');
      setHasBudget(budgetCheck.data.hasBudget);

      return { success: true, data: userData, hasBudget: budgetCheck.data.hasBudget };
    } catch (err) {
      const errorMsg = err.response?.data?.non_field_errors?.[0] || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setHasBudget(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    hasBudget,
    register,
    login,
    logout,
    isAuthenticated: !!user,
    setHasBudget, // Allow manual update after budget creation
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};