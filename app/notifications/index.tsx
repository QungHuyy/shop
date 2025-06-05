import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotification } from '../../contexts/NotificationContext';
import { Notification } from '../../services/notificationService';

export default function NotificationsScreen() {
  const {
    notifications,
    summary,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotification();

  // Mark all as read when entering screen
  useEffect(() => {
    if (summary.unread > 0) {
      markAllAsRead();
    }
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to order detail if it's order notification
    if (notification.type === 'order_status' && notification.orderId) {
      // @ts-ignore - Dynamic route will work at runtime
      router.push(`/order-detail/${notification.orderId}`);
    }
  };

  const handleDeleteNotification = (notification: Notification) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteNotification(notification.id)
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Xóa tất cả thông báo',
      'Bạn có chắc chắn muốn xóa tất cả thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: clearAll
        }
      ]
    );
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Vừa xong';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'order_status': return 'receipt-outline';
      case 'system': return 'settings-outline';
      case 'promotion': return 'gift-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'order_status': return '#fed700';
      case 'system': return '#3742fa';
      case 'promotion': return '#2ed573';
      default: return '#666';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadItem
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.leftSection}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: getNotificationColor(item.type) }
            ]}>
              <Ionicons
                name={getNotificationIcon(item.type) as any}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.notificationInfo}>
              <Text style={[
                styles.notificationTitle,
                !item.isRead && styles.unreadTitle
              ]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
          
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item)}
      >
        <Ionicons name="trash-outline" size={18} color="#ff4757" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có thông báo</Text>
      <Text style={styles.emptySubtext}>
        Thông báo về đơn hàng và cập nhật sẽ xuất hiện tại đây
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fed700" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Thông báo {notifications.length > 0 && `(${notifications.length})`}
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshNotifications}
            colors={['#fed700']}
            tintColor={'#fed700'}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fed700',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  clearAllButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadItem: {
    backgroundColor: '#fffbf0',
    borderLeftWidth: 4,
    borderLeftColor: '#fed700',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fed700',
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 52,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 