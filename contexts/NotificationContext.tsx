import React, { createContext, useContext, useState } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface NotificationContextType {
  showNotification: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showNotification = (message: string, type: ToastType, duration: number = 3000) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const showSuccess = (message: string, duration: number = 3000) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message: string, duration: number = 4000) => {
    showNotification(message, 'error', duration);
  };

  const showWarning = (message: string, duration: number = 3500) => {
    showNotification(message, 'warning', duration);
  };

  const showInfo = (message: string, duration: number = 3000) => {
    showNotification(message, 'info', duration);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
        duration={toast.duration}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 