import React, { useState, useEffect } from 'react';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../../config/api';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import couponService, { Coupon } from '../../services/couponService';
import orderHistoryService from '../../services/orderHistoryService';

interface CouponWithStatus extends Coupon {
  isUsed: boolean;
  isApplied?: boolean;
}

export default function VouchersScreen() {
  const { user, isAuthenticated } = useAuth();
  const { coupon: appliedCoupon, couponId: appliedCouponId, isCouponApplied } = useCart();
  const [coupons, setCoupons] = useState<CouponWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'used'>('available');

  const fetchCoupons = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để xem mã giảm giá',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push({ pathname: '/sign-in' } as any) }
        ]
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Lấy tất cả mã giảm giá từ server
      const response = await fetch(COUPON_API);
      const data = await response.json();
      const availableCoupons = data.coupons || [];
      
      // Lấy danh sách mã giảm giá đã sử dụng của người dùng
      const usedCouponIds = await orderHistoryService.checkUsedCoupons(user._id);
      
      // Kết hợp dữ liệu và đánh dấu mã đã sử dụng và đang áp dụng
      const couponWithStatus: CouponWithStatus[] = availableCoupons.map((coupon: Coupon) => ({
        ...coupon,
        isUsed: usedCouponIds.includes(coupon._id),
        isApplied: isCouponApplied() && coupon._id === appliedCouponId
      }));
      
      setCoupons(couponWithStatus);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, [isAuthenticated]);

  const handleApplyCoupon = async (coupon: CouponWithStatus) => {
    if (coupon.isUsed) {
      Alert.alert('Thông báo', 'Bạn đã sử dụng mã giảm giá này rồi');
      return;
    }

    if (coupon.count <= 0) {
      Alert.alert('Thông báo', 'Mã giảm giá đã hết lượt sử dụng');
      return;
    }
    
    if (coupon.isApplied) {
      Alert.alert('Thông báo', 'Mã giảm giá này đã được áp dụng');
      router.push({ pathname: '/cart' } as any);
      return;
    }

    if (isCouponApplied()) {
      Alert.alert(
        'Thông báo',
        'Bạn đã áp dụng một mã giảm giá khác. Vui lòng xóa mã hiện tại trước khi áp dụng mã mới.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đi đến giỏ hàng', onPress: () => router.push({ pathname: '/cart' } as any) }
        ]
      );
      return;
    }

    // Lưu mã giảm giá và chuyển đến giỏ hàng
    try {
      await couponService.saveCoupon(coupon);
      Alert.alert(
        'Thành công',
        'Đã lưu mã giảm giá. Vui lòng vào giỏ hàng để áp dụng.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đi đến giỏ hàng', onPress: () => router.push({ pathname: '/cart' } as any) }
        ]
      );
    } catch (error) {
      console.error('Error saving coupon:', error);
      Alert.alert('Lỗi', 'Không thể lưu mã giảm giá');
    }
  };

  // Lọc danh sách mã giảm giá dựa theo tab đang chọn
  const filteredCoupons = coupons.filter(coupon => {
    if (activeTab === 'available') {
      return !coupon.isUsed && coupon.count > 0;
    } else {
      return coupon.isUsed || coupon.count <= 0;
    }
  });

  const renderCouponItem = ({ item }: { item: CouponWithStatus }) => (
    <View style={[styles.couponCard, item.isUsed && styles.usedCoupon]}>
      <View style={styles.couponHeader}>
        <Text style={styles.couponCode}>{item.code}</Text>
        {item.isUsed && (
          <View style={styles.usedBadge}>
            <Text style={styles.usedBadgeText}>Đã sử dụng</Text>
          </View>
        )}
        {!item.isUsed && item.count <= 0 && (
          <View style={[styles.usedBadge, { backgroundColor: '#6c757d' }]}>
            <Text style={styles.usedBadgeText}>Hết lượt dùng</Text>
          </View>
        )}
        {item.isApplied && (
          <View style={[styles.usedBadge, { backgroundColor: '#28a745' }]}>
            <Text style={styles.usedBadgeText}>Đang áp dụng</Text>
          </View>
        )}
      </View>
      
      <View style={styles.couponBody}>
        <Text style={styles.couponDescription}>{item.describe}</Text>
        <Text style={styles.couponDiscount}>Giảm {item.promotion}%</Text>
        <Text style={styles.couponCount}>Còn lại: {item.count}</Text>
      </View>
      
      <View style={styles.couponFooter}>
        {!item.isUsed && item.count > 0 ? (
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => handleApplyCoupon(item)}
          >
            <Text style={styles.applyButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.unavailableButton}>
            <Text style={styles.unavailableButtonText}>
              {item.isUsed ? 'Đã sử dụng' : 'Hết lượt dùng'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mã giảm giá</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'available' && styles.activeTab
          ]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'available' && styles.activeTabText
          ]}>
            Có thể sử dụng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'used' && styles.activeTab
          ]}
          onPress={() => setActiveTab('used')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'used' && styles.activeTabText
          ]}>
            Đã sử dụng/Hết hạn
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải mã giảm giá...</Text>
        </View>
      ) : (
        <>
          {filteredCoupons.length > 0 ? (
            <FlatList
              data={filteredCoupons}
              renderItem={renderCouponItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>
                {activeTab === 'available' 
                  ? 'Không có mã giảm giá nào có thể sử dụng'
                  : 'Bạn chưa sử dụng mã giảm giá nào'
                }
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fed700',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 15,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#fed700',
  },
  usedCoupon: {
    borderLeftColor: '#ccc',
    opacity: 0.8,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  couponCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  usedBadge: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  usedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  couponBody: {
    padding: 15,
  },
  couponDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  couponDiscount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 5,
  },
  couponCount: {
    fontSize: 14,
    color: '#666',
  },
  couponFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    alignItems: 'flex-end',
  },
  applyButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  applyButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  unavailableButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  unavailableButtonText: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
}); 