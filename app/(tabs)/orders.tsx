import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import orderHistoryService, { OrderHistory } from '../../services/orderHistoryService';

export default function OrdersScreen() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const interval = setInterval(() => {
      autoRefreshOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?._id) {
        loadOrders();
      }
    }, [isAuthenticated, user])
  );

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadOrders = async (showLoading = true) => {
    if (!user?._id) return;
    
    try {
      if (showLoading) setLoading(true);
      const orderHistory = await orderHistoryService.getOrderHistory(user._id);
      
      // Check for status changes
      if (orders.length > 0) {
        checkForStatusChanges(orders, orderHistory);
      }
      
      setOrders(orderHistory);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử đơn hàng');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const autoRefreshOrders = async () => {
    if (!user?._id || refreshing || loading) return;
    
    try {
      setAutoRefreshing(true);
      const orderHistory = await orderHistoryService.getOrderHistory(user._id);
      
      // Check for status changes
      if (orders.length > 0) {
        checkForStatusChanges(orders, orderHistory);
      }
      
      setOrders(orderHistory);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Auto refresh error:', error);
    } finally {
      setAutoRefreshing(false);
    }
  };

  const checkForStatusChanges = (oldOrders: OrderHistory[], newOrders: OrderHistory[]) => {
    newOrders.forEach(newOrder => {
      const oldOrder = oldOrders.find(o => o._id === newOrder._id);
      if (oldOrder && oldOrder.status !== newOrder.status) {
        // Status has changed, show notification
        showStatusChangeNotification(newOrder, oldOrder.status, newOrder.status);
      }
    });
  };

  const showStatusChangeNotification = (order: OrderHistory, oldStatus: string, newStatus: string) => {
    const oldStatusText = orderHistoryService.getStatusText(oldStatus);
    const newStatusText = orderHistoryService.getStatusText(newStatus);
    
    Alert.alert(
      'Cập nhật trạng thái đơn hàng',
      `Đơn hàng #${order._id.slice(-6)} đã được cập nhật từ "${oldStatusText}" thành "${newStatusText}"`,
      [{ text: 'OK' }]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(false);
    setRefreshing(false);
  };

  const handleCancelOrder = (order: OrderHistory) => {
    if (!orderHistoryService.canCancelOrder(order.status, order.pay)) {
      Alert.alert(
        'Không thể hủy',
        order.pay 
          ? 'Không thể hủy đơn hàng đã thanh toán'
          : 'Không thể hủy đơn hàng ở trạng thái này'
      );
      return;
    }

    Alert.alert(
      'Xác nhận hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng #${order._id.slice(-6)}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn hàng',
          style: 'destructive',
          onPress: async () => {
            const success = await orderHistoryService.cancelOrder(order._id);
            if (success) {
              Alert.alert('Thành công', 'Đơn hàng đã được hủy');
              loadOrders(); // Reload orders
            } else {
              Alert.alert('Lỗi', 'Không thể hủy đơn hàng');
            }
          }
        }
      ]
    );
  };

  const handleViewDetail = (orderId: string) => {
    // @ts-ignore - Dynamic route will work at runtime  
    router.push(`/order-detail/${orderId}`);
  };

  const formatLastUpdateTime = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdateTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} giây trước`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)} phút trước`;
    } else {
      return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    }
  };

  const renderOrderItem = ({ item }: { item: OrderHistory }) => (
    <View style={styles.orderItem}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: orderHistoryService.getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {orderHistoryService.getStatusText(item.status)}
          </Text>
        </View>
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.id_note.fullname}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.id_note.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.create_time}</Text>
        </View>
      </View>

      {/* Price & Payment */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalPrice}>
            {orderHistoryService.formatPrice(item.total)}
          </Text>
        </View>
        <View style={styles.paymentRow}>
          <View style={[styles.paymentBadge, { backgroundColor: item.pay ? '#28a745' : '#ff4757' }]}>
            <Text style={styles.paymentText}>
              {item.pay ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewDetail(item._id)}
        >
          <Text style={styles.viewButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
        
        {orderHistoryService.canCancelOrder(item.status, item.pay) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(item)}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
      <Text style={styles.emptySubtext}>Hãy đặt hàng để xem lịch sử đơn hàng tại đây</Text>
      
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.push('/products')}
      >
        <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginRequired = () => (
    <View style={styles.emptyState}>
      <Ionicons name="log-in-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>Vui lòng đăng nhập</Text>
      <Text style={styles.emptySubtext}>Đăng nhập để xem lịch sử đơn hàng của bạn</Text>
      
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.push('/(auth)/sign-in')}
      >
        <Text style={styles.shopButtonText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        </View>
        <ScrollView style={styles.content}>
          {renderLoginRequired()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fed700" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
            <Text style={styles.orderCount}>({orders.length} đơn hàng)</Text>
          </View>
          <View style={styles.headerRight}>
            {autoRefreshing && (
              <View style={styles.autoRefreshIndicator}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.autoRefreshText}>Đang cập nhật...</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => loadOrders()}
              disabled={loading || autoRefreshing}
            >
              <Ionicons name="refresh" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.lastUpdateText}>
          Cập nhật lần cuối: {formatLastUpdateTime()}
        </Text>
      </View>
      
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fed700',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  ordersList: {
    padding: 15,
  },
  orderItem: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fe0000',
  },
  paymentRow: {
    alignItems: 'flex-start',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#fed700',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  viewButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ff4757',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoRefreshIndicator: {
    marginRight: 8,
  },
  autoRefreshText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  lastUpdateText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
}); 