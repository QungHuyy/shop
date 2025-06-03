import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
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
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn({ email, password });
    setUser(response.user);
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    await authService.signUp({ fullName, email, password });
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