import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import orderHistoryService, { OrderHistory, OrderDetail } from '../../services/orderHistoryService';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addOrderStatusNotification } = useNotification();
  const { cartSummary } = useCart();
  const [order, setOrder] = useState<OrderHistory | null>(null);
  const [orderItems, setOrderItems] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // Auto-refresh every 15 seconds for order detail
  useEffect(() => {
    if (!id) return;

    loadOrderDetail();

    const interval = setInterval(() => {
      autoRefreshOrder();
    }, 15000); // 15 seconds for more frequent updates

    return () => clearInterval(interval);
  }, [id]);

  const loadOrderDetail = async (showLoading = true) => {
    if (!id) return;

    try {
      if (showLoading) setLoading(true);
      
      // Load order info and items in parallel
      const [orderInfo, items] = await Promise.all([
        orderHistoryService.getOrderDetail(id),
        orderHistoryService.getOrderItems(id)
      ]);
      
      console.log('Order Detail - Order ID:', id);
      console.log('Order Detail - Order Info:', orderInfo);
      console.log('Order Detail - Order Status:', orderInfo?.status);
      console.log('Order Detail - Order Items:', items);
      console.log('Order Detail - Items Length:', items?.length || 0);
      
      // Check if order exists
      if (!orderInfo || orderInfo === null) {
        Alert.alert('Lỗi', 'Đơn hàng không tồn tại hoặc đã bị xóa');
        router.back();
        return;
      }
      
      // Check for status change
      if (order && order.status !== orderInfo.status) {
        showStatusChangeNotification(orderInfo, order.status, orderInfo.status);
      }
      
      setOrder(orderInfo);
      setOrderItems(items || []);
    } catch (error) {
      console.error('Error loading order detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng. Đơn hàng có thể không tồn tại.');
      router.back();
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const autoRefreshOrder = async () => {
    if (!id || refreshing || loading) return;
    
    try {
      setAutoRefreshing(true);
      
      // Load order info and items in parallel
      const [orderInfo, items] = await Promise.all([
        orderHistoryService.getOrderDetail(id),
        orderHistoryService.getOrderItems(id)
      ]);
      
      // Check for status change
      if (order && order.status !== orderInfo.status) {
        showStatusChangeNotification(orderInfo, order.status, orderInfo.status);
      }
      
      setOrder(orderInfo);
      setOrderItems(items || []);
    } catch (error) {
      console.error('Auto refresh error:', error);
    } finally {
      setAutoRefreshing(false);
    }
  };

  const showStatusChangeNotification = (orderInfo: OrderHistory, oldStatus: string, newStatus: string) => {
    // Use notification system instead of alert
    addOrderStatusNotification(orderInfo._id, oldStatus, newStatus);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetail(false);
    setRefreshing(false);
  };

  const handleCancelOrder = () => {
    if (!order) return;

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
              loadOrderDetail(); // Reload order
            } else {
              Alert.alert('Lỗi', 'Không thể hủy đơn hàng');
            }
          }
        }
      ]
    );
  };

  const renderProgressBar = () => {
    if (!order) return null;

    const statusSteps = [
      { status: '1', label: 'Đang xử lý', icon: 'hourglass-outline' },
      { status: '2', label: 'Đã xác nhận', icon: 'checkmark-circle-outline' },
      { status: '3', label: 'Đang giao', icon: 'car-outline' },
      { status: '4', label: 'Hoàn thành', icon: 'trophy-outline' },
    ];

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Trạng thái đơn hàng</Text>

        {/* Status Steps */}
        <View style={styles.statusSteps}>
          {statusSteps.map((step, index) => {
            const isCompleted = parseInt(order.status) >= parseInt(step.status);
            const isCurrent = order.status === step.status;
            
            return (
              <View key={step.status} style={styles.statusStep}>
                <View style={[
                  styles.statusIcon,
                  isCompleted ? styles.statusIconCompleted : styles.statusIconPending,
                  isCurrent ? styles.statusIconCurrent : {}
                ]}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={20} 
                    color={isCompleted ? '#fff' : '#ccc'} 
                  />
                </View>
                <Text style={[
                  styles.statusLabel,
                  isCompleted ? styles.statusLabelCompleted : styles.statusLabelPending,
                  isCurrent ? styles.statusLabelCurrent : {}
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Estimated Message */}
        <View style={styles.estimatedMessageContainer}>
          <Text style={styles.estimatedMessage}>
            {orderHistoryService.getEstimatedDeliveryMessage(order.status)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          {autoRefreshing && (
            <View style={styles.headerRefreshIndicator}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.headerRefreshText}>Đang cập nhật...</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="bag-outline" size={20} color="#666" />
          {cartSummary?.totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#fed700']}
            tintColor={'#fed700'}
          />
        }
      >
        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Order Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: orderHistoryService.getStatusColor(order.status) }
            ]}>
              <Text style={styles.statusText}>
                {orderHistoryService.getStatusText(order.status)}
              </Text>
            </View>
            <View style={styles.paymentStatus}>
              <View style={[
                styles.paymentBadge, 
                { backgroundColor: order.pay ? '#28a745' : '#ff4757' }
              ]}>
                <Text style={styles.paymentText}>
                  {order.pay ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Người nhận:</Text>
              <Text style={styles.infoValue}>{order.id_note.fullname}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoValue}>{order.id_note.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              <Text style={styles.infoValue}>{order.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Ngày đặt:</Text>
              <Text style={styles.infoValue}>{order.create_time}</Text>
            </View>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã đặt ({orderItems.length})</Text>
          {orderItems.length > 0 ? (
            orderItems.map((item, index) => (
              <View key={index} style={styles.productItem}>
                <Image 
                  source={{ uri: item.id_product.image }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name_product}
                  </Text>
                  <Text style={styles.productSize}>Size: {item.size}</Text>
                  <Text style={styles.productPrice}>
                    {orderHistoryService.formatPrice(parseInt(item.price_product))}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Số lượng: {item.count}
                  </Text>
                  <Text style={styles.productTotal}>
                    Tổng: {orderHistoryService.formatPrice(parseInt(item.price_product) * item.count)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noProductsContainer}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.noProductsText}>Không thể tải thông tin sản phẩm</Text>
              <Text style={styles.noProductsSubtext}>
                Thông tin chi tiết sản phẩm trong đơn hàng này không khả dụng. 
                Điều này có thể xảy ra với các đơn hàng cũ hoặc đã hoàn thành lâu.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadOrderDetail()}
              >
                <Text style={styles.retryButtonText}>Thử tải lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backToOrdersButton}
                onPress={() => router.push('/orders')}
              >
                <Text style={styles.backToOrdersButtonText}>Về danh sách đơn hàng</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng kết đơn hàng</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng tiền hàng:</Text>
              <Text style={styles.summaryValue}>
                {orderHistoryService.formatPrice(order.total)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
              <Text style={styles.summaryValue}>
                {orderHistoryService.formatPrice(order.feeship || 0)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.summaryTotalValue}>
                {orderHistoryService.formatPrice(order.total + (order.feeship || 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {orderHistoryService.canCancelOrder(order.status, order.pay) && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerRefreshText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cartButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  updateTimeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  updateTimeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fed700',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginTop: 4,
  },
  statusSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusStep: {
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  statusIconCompleted: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  statusIconPending: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  statusIconCurrent: {
    backgroundColor: '#fed700',
    borderColor: '#fed700',
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusLabelCompleted: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  statusLabelPending: {
    color: '#999',
  },
  statusLabelCurrent: {
    color: '#333',
    fontWeight: 'bold',
  },
  currentStatusIndicator: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  estimatedMessageContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  estimatedMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#fe0000',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCard: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 12,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fe0000',
  },
  actionSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#ff4757',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomSpacer: {
    height: 100,
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  noProductsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#fed700',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  backToOrdersButton: {
    padding: 12,
    backgroundColor: '#fed700',
    borderRadius: 8,
    alignItems: 'center',
  },
  backToOrdersButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
}); 