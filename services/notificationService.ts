import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_status' | 'system' | 'promotion';
  isRead: boolean;
  createdAt: Date;
  orderId?: string;
  metadata?: any;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}

const STORAGE_KEY = 'app_notifications';
const NOTIFIED_TRANSITIONS_KEY = 'notified_transitions';

class NotificationService {
  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored);
      // Convert date strings back to Date objects
      return notifications.map((notif: any) => ({
        ...notif,
        createdAt: new Date(notif.createdAt)
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get notified transitions (để tránh thông báo trùng lặp)
  private async getNotifiedTransitions(): Promise<Set<string>> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFIED_TRANSITIONS_KEY);
      if (!stored) return new Set();
      
      const transitions = JSON.parse(stored);
      return new Set(transitions);
    } catch (error) {
      console.error('Error getting notified transitions:', error);
      return new Set();
    }
  }

  // Save notified transitions
  private async saveNotifiedTransitions(transitions: Set<string>): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFIED_TRANSITIONS_KEY, JSON.stringify([...transitions]));
    } catch (error) {
      console.error('Error saving notified transitions:', error);
    }
  }

  // Create unique key for transition
  private createTransitionKey(orderId: string, oldStatus: string, newStatus: string): string {
    return `${orderId}_${oldStatus}_to_${newStatus}`;
  }

  // Add new notification
  async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        isRead: false,
        createdAt: new Date()
      };

      notifications.unshift(newNotification); // Add to beginning
      
      // Keep only last 100 notifications
      const trimmed = notifications.slice(0, 100);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      );
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(notif => ({ ...notif, isRead: true }));
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const filtered = notifications.filter(notif => notif.id !== notificationId);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get notification summary
  async getSummary(): Promise<NotificationSummary> {
    try {
      const notifications = await this.getNotifications();
      return {
        total: notifications.length,
        unread: notifications.filter(notif => !notif.isRead).length
      };
    } catch (error) {
      console.error('Error getting notification summary:', error);
      return { total: 0, unread: 0 };
    }
  }

  // Add order status change notification
  async addOrderStatusNotification(
    orderId: string,
    oldStatus: string, 
    newStatus: string
  ): Promise<void> {
    // Tạo key duy nhất cho transition này
    const transitionKey = this.createTransitionKey(orderId, oldStatus, newStatus);
    
    // Kiểm tra xem đã thông báo transition này chưa
    const notifiedTransitions = await this.getNotifiedTransitions();
    if (notifiedTransitions.has(transitionKey)) {
      return; // Đã thông báo rồi, bỏ qua
    }

    const getStatusText = (status: string): string => {
      switch (status) {
        case '1': return 'Đang xử lý';
        case '2': return 'Đã xác nhận';
        case '3': return 'Đang giao';
        case '4': return 'Hoàn thành';
        case '0': return 'Đã hủy';
        default: return 'Không xác định';
      }
    };

    const getStatusIcon = (status: string): string => {
      switch (status) {
        case '1': return '⏳';
        case '2': return '✅';
        case '3': return '🚚';
        case '4': return '🎉';
        case '0': return '❌';
        default: return '📦';
      }
    };

    const oldStatusText = getStatusText(oldStatus);
    const newStatusText = getStatusText(newStatus);
    const statusIcon = getStatusIcon(newStatus);

    // Tạo thông báo mới
    await this.addNotification({
      title: `${statusIcon} Cập nhật trạng thái đơn hàng`,
      message: `Đơn hàng đã được cập nhật từ "${oldStatusText}" thành "${newStatusText}"`,
      type: 'order_status',
      orderId,
      metadata: {
        oldStatus,
        newStatus,
        transitionKey
      }
    });

    // Lưu transition key để tránh thông báo lặp lại
    notifiedTransitions.add(transitionKey);
    await this.saveNotifiedTransitions(notifiedTransitions);
  }

  // Clear old transition records (gọi định kỳ để dọn dẹp)
  async cleanupOldTransitions(): Promise<void> {
    try {
      const notifiedTransitions = await this.getNotifiedTransitions();
      
      // Giữ lại tối đa 100 transitions gần nhất
      if (notifiedTransitions.size > 100) {
        const transitionsArray = [...notifiedTransitions];
        const recentTransitions = new Set(transitionsArray.slice(-100));
        await this.saveNotifiedTransitions(recentTransitions);
      }
    } catch (error) {
      console.error('Error cleaning up old transitions:', error);
    }
  }

  // Clear all notified transitions (for testing or reset)
  async clearNotifiedTransitions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIFIED_TRANSITIONS_KEY);
    } catch (error) {
      console.error('Error clearing notified transitions:', error);
    }
  }
}

export default new NotificationService(); 