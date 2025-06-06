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
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import orderHistoryService, { OrderHistory } from '../../services/orderHistoryService';

type OrderStatus = '1' | '2' | '3' | '4' | '0';

interface StatusTab {
  key: OrderStatus;
  label: string;
  icon: string;
  color: string;
}

const STATUS_TABS: StatusTab[] = [
  { key: '1', label: 'Đang xử lý', icon: 'hourglass-outline', color: '#ffa502' },
  { key: '2', label: 'Đã xác nhận', icon: 'checkmark-circle-outline', color: '#3742fa' },
  { key: '3', label: 'Đang giao', icon: 'car-outline', color: '#2ed573' },
  { key: '4', label: 'Hoàn thành', icon: 'trophy-outline', color: '#28a745' },
  { key: '0', label: 'Đã hủy', icon: 'close-circle-outline', color: '#ff4757' },
];

export default function OrdersScreen() {
  const { user, isAuthenticated } = useAuth();
  const { cartSummary } = useCart();
  const { addOrderStatusNotification } = useNotification();
  const [allOrders, setAllOrders] = useState<OrderHistory[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('1');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

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
      if (allOrders.length > 0) {
        checkForStatusChanges(allOrders, orderHistory);
      }
      
      setAllOrders(orderHistory);
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
      if (allOrders.length > 0) {
        checkForStatusChanges(allOrders, orderHistory);
      }
      
      setAllOrders(orderHistory);
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
    addOrderStatusNotification(order._id, oldStatus, newStatus);
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
      `Bạn có chắc chắn muốn hủy đơn hàng này?`,
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

  // Filter orders by active tab status
  const getFilteredOrders = () => {
    console.log(`Filtering orders by status: ${activeTab}`);
    console.log(`All orders statuses:`, allOrders.map(o => o.status));
    const filtered = allOrders.filter(order => order.status === activeTab);
    console.log(`Found ${filtered.length} orders with status ${activeTab}`);
    return filtered;
  };

  // Get count for each tab
  const getTabCount = (status: OrderStatus) => {
    return allOrders.filter(order => order.status === status).length;
  };

  // Hàm xử lý nút back an toàn
  const handleBackPress = () => {
    try {
      // Kiểm tra xem có thể quay lại không
      if (router.canGoBack()) {
        router.back();
      } else {
        // Nếu không thể quay lại, chuyển về trang chính
        router.replace('/');
      }
    } catch (error) {
      console.log('Navigation error:', error);
      router.replace('/');
    }
  };

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContainer}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = getTabCount(tab.key);
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                { borderBottomColor: isActive ? tab.color : 'transparent' }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={styles.tabContent}>
                <Ionicons 
                  name={tab.icon as any} 
                  size={24} 
                  color={isActive ? tab.color : '#999'} 
                />
                <Text style={[
                  styles.tabLabel,
                  isActive && { color: tab.color, fontWeight: 'bold' }
                ]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

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

  const renderEmptyState = () => {
    const currentTab = STATUS_TABS.find(tab => tab.key === activeTab);
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name={currentTab?.icon as any} size={80} color="#ccc" />
        <Text style={styles.emptyText}>Không có đơn hàng {currentTab?.label.toLowerCase()}</Text>
        <Text style={styles.emptySubtext}>
          {activeTab === '1' 
            ? 'Hãy đặt hàng để xem đơn hàng đang xử lý tại đây'
            : `Chưa có đơn hàng nào ở trạng thái ${currentTab?.label.toLowerCase()}`
          }
        </Text>
        
        {activeTab === '1' && (
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/products')}
          >
            <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLoginRequired = () => (
    <View style={styles.emptyState}>
      <Ionicons name="log-in-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>Chưa đăng nhập</Text>
      <Text style={styles.emptySubtext}>Đăng nhập để xem lịch sử đơn hàng của bạn</Text>
      
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => {
          Alert.alert(
            'Yêu cầu đăng nhập',
            'Bạn cần đăng nhập để xem đơn hàng của mình',
            [
              { text: 'Tiếp tục không đăng nhập', style: 'cancel' },
              { 
                text: 'Đăng nhập', 
                onPress: () => router.push('/(auth)/sign-in')
              }
            ]
          );
        }}
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

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fed700" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
          
          <View style={styles.headerRight}>
            {autoRefreshing && (
              <ActivityIndicator size="small" color="#666" style={styles.refreshIndicator} />
            )}
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="bag-outline" size={24} color="#333" />
              {cartSummary?.totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Header */}
      {renderTabHeader()}
      
      {/* Orders List */}
      <FlatList
        data={filteredOrders}
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIndicator: {
    marginRight: 8,
  },
  cartButton: {
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingVertical: 8,
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    // Active border color is set dynamically
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 80,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
}); 