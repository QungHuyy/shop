import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import orderService, { OrderFormData } from '../../services/orderService';
import couponService from '../../services/couponService';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen() {
  const { cartItems, cartSummary, coupon, couponId, discount, finalPrice, clearCart, removeCoupon } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>({
    fullname: user?.fullname || '',
    phone: user?.phone || '',
    address: '',
    email: user?.email || '',
  });

  const [errors, setErrors] = useState<Partial<OrderFormData>>({});

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Vui lòng nhập họ tên';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      Alert.alert('Thông tin không hợp lệ', 'Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đặt hàng');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng');
      return;
    }

    setLoading(true);

    try {
      // Get the final price (with discount if coupon is applied)
      const totalAmount = finalPrice || cartSummary.totalPrice;
      
      // Place order with coupon ID if available
      const success = await orderService.placeOrder(
        formData,
        cartItems,
        totalAmount,
        user._id,
        couponId
      );

      if (success) {
              // If coupon was used, update it on the server
      if (couponId) {
        try {
          // Gọi API để giảm số lượng coupon và đánh dấu rằng người dùng đã sử dụng
          const couponResponse = await couponService.updateCoupon(couponId);
          if (!couponResponse || couponResponse.msg !== "Thanh Cong") {
            console.warn('Coupon update response was not successful:', couponResponse);
            // Vẫn tiếp tục đặt hàng thành công ngay cả khi cập nhật coupon thất bại
          }
        } catch (error) {
          console.error('Error updating coupon:', error);
          // Continue with order success even if coupon update fails
        }
      }
        
        // Clear cart and coupon after successful order
        await clearCart();
        await removeCoupon();
        
        Alert.alert(
          'Đặt hàng thành công!',
          'Đơn hàng của bạn đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm nhất.',
          [{ text: 'OK', onPress: () => router.replace('/order-success') }]
        );
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Lỗi đặt hàng', 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Số lượng sản phẩm:</Text>
              <Text style={styles.summaryValue}>{cartSummary.totalItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính:</Text>
              <Text style={styles.summaryValue}>{formatPrice(cartSummary.totalPrice)}</Text>
            </View>
            {coupon && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mã giảm giá:</Text>
                <View style={styles.couponInfo}>
                  <Text style={styles.couponCode}>{coupon.code} (-{coupon.promotion}%)</Text>
                  <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
                </View>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
              <Text style={styles.summaryValue}>Miễn phí</Text>
            </View>
            <View style={[styles.summaryRow, styles.finalTotal]}>
              <Text style={styles.summaryLabel}>Thành tiền:</Text>
              <Text style={styles.summaryTotal}>{formatPrice(finalPrice || cartSummary.totalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={[styles.input, errors.fullname && styles.inputError]}
              value={formData.fullname}
              onChangeText={(text) => handleInputChange('fullname', text)}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
            />
            {errors.fullname && <Text style={styles.errorText}>{errors.fullname}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Nhập email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Địa chỉ giao hàng *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Nhập địa chỉ giao hàng"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentCard}>
            <Ionicons name="cash-outline" size={24} color="#fed700" />
            <Text style={styles.paymentText}>Thanh toán khi nhận hàng (COD)</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              Đặt hàng • {formatPrice(finalPrice || cartSummary.totalPrice)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  couponInfo: {
    alignItems: 'flex-end',
  },
  couponCode: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  summaryTotal: {
    fontSize: 16,
    color: '#fe0000',
    fontWeight: 'bold',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 8,
    paddingTop: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  placeOrderButton: {
    backgroundColor: '#fed700',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 