import React, { createContext, useState, useContext, useEffect } from 'react';
import { authClient } from '@/api/authClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    const token = authClient.getToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    try {
      const currentUser = await authClient.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      authClient.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const login = async (email, password) => {
    setAuthError(null);
    const result = await authClient.login(email, password);
    const token = result?.token || result?.accessToken;
    if (token) {
      authClient.setToken(token);
      await checkUserAuth();
    }
    return result;
  };

  const register = async (email, password) => {
    setAuthError(null);
    const result = await authClient.register(email, password);
    const token = result?.token || result?.accessToken;
    if (token) {
      authClient.setToken(token);
      await checkUserAuth();
    }
    return result;
  };

  const requestPasswordReset = async (email) => {
    setAuthError(null);
    return authClient.requestPasswordReset(email);
  };

  const resetPassword = async (token, newPassword) => {
    setAuthError(null);
    return authClient.resetPassword(token, newPassword);
  };

  const logout = (redirect = true) => {
    authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (redirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      authChecked,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
      navigateToLogin,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
