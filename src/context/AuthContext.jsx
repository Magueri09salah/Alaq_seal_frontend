import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Register new user + auto-login
   */
  const register = async (data) => {
    const response = await authAPI.register(data);
    const { token, user: userData } = response.data;

    // Save token + user
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);

    return response;
  };

  /**
   * Login existing user
   */
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);

    return response;
  };

  /**
   * Login with Google - redirect to backend OAuth
   */
  const loginWithGoogle = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://104.248.39.250/api/v1';
    window.location.href = `${apiUrl}/auth/google/redirect`;
  };

  /**
   * Set user from Google OAuth callback
   */
  const setUserFromGoogle = (userData) => {
    setUser(userData);
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    loginWithGoogle,
    setUserFromGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};