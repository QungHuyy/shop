import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { AuthResponse } from '../services/authService';
import cartService from '../services/cartService';

interface User {
  _id: string;
  username: string;
  fullname: string;
  email?: string;
  phone?: string;
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
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
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
          await cartService.setCurrentUserId(currentUser._id);
          console.log('🔐 User authenticated from storage:', currentUser.username);
        } else {
          console.log('🔓 No authenticated user found in storage');
          await cartService.setCurrentUserId(null);
        }
      } catch (error) {
        console.log('Không có người dùng đã đăng nhập');
        await cartService.setCurrentUserId(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      console.log('🔑 Attempting sign in for user:', username);
      const response = await authService.signIn({ username, password });
      if (response) {
        setUser(response);
        
        // Lưu ID người dùng trong cartService
        await cartService.setCurrentUserId(response._id);
        console.log('👤 User ID set in cart service:', response._id);
        
        // Đồng bộ giỏ hàng local lên server
        await cartService.syncCartToServer(response._id);
        console.log('🔄 Cart synced to server for user:', response._id);
      }
    } catch (error) {
      console.error('❌ Sign in failed:', error);
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

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user');
      // Xóa ID người dùng trong cartService trước khi đăng xuất
      await cartService.setCurrentUserId(null);
      await authService.signOut();
      setUser(null);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, ...userData } as User;
    });
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await cartService.setCurrentUserId(currentUser._id);
      } else {
        await cartService.setCurrentUserId(null);
      }
    } catch (error) {
      console.log('Không có người dùng đã đăng nhập');
      await cartService.setCurrentUserId(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 