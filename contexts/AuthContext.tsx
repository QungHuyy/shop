import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { AuthResponse } from '../services/authService';

interface User {
  _id: string;
  username: string;
  fullname: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (userData: {
    fullname: string;
    username: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.log('Không có người dùng đã đăng nhập');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await authService.signIn({ username, password });
      if (response) {
        setUser(response);
      }
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (userData: {
    fullname: string;
    username: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      await authService.signUp(userData);
    } catch (error) {
      throw error;
    }
  };

  const signOut = () => {
    authService.signOut();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 