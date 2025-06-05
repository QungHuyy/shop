import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import notificationService, { Notification, NotificationSummary } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  notifications: Notification[];
  summary: NotificationSummary;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addOrderStatusNotification: (orderId: string, oldStatus: string, newStatus: string) => Promise<void>;
  clearNotifiedTransitions: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await loadNotifications();
      
      // Cleanup old transitions mỗi 5 phút (10 lần auto-refresh)
      const now = Date.now();
      const lastCleanup = parseInt(await AsyncStorage.getItem('last_transition_cleanup') || '0');
      if (now - lastCleanup > 5 * 60 * 1000) { // 5 phút
        await notificationService.cleanupOldTransitions();
        await AsyncStorage.setItem('last_transition_cleanup', now.toString());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notifs, summaryData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getSummary()
      ]);
      
      setNotifications(notifs);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAll();
      await refreshNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const addOrderStatusNotification = async (
    orderId: string, 
    oldStatus: string, 
    newStatus: string
  ) => {
    try {
      await notificationService.addOrderStatusNotification(orderId, oldStatus, newStatus);
      await refreshNotifications();
    } catch (error) {
      console.error('Error adding order status notification:', error);
    }
  };

  const clearNotifiedTransitions = async () => {
    try {
      await notificationService.clearNotifiedTransitions();
      await refreshNotifications();
    } catch (error) {
      console.error('Error clearing notified transitions:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    summary,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addOrderStatusNotification,
    clearNotifiedTransitions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 