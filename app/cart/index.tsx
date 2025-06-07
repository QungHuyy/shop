import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { CartItem } from '../../services/cartService';
import productService from '../../services/productService';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const { 
    cartItems, 
    cartSummary, 
    loading, 
    coupon, 
    discount, 
    finalPrice,
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    refreshCart,
    applyCoupon,
    removeCoupon,
    isCouponApplied
  } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // Đặt tất cả các useState liên tiếp nhau
  const [refreshing, setRefreshing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Tạo hàm để buộc cập nhật UI
  const [, forceUpdate] = useState({});
  
  // Tạo state riêng để theo dõi giá đã giảm
  const [discountedPrice, setDiscountedPrice] = useState(0);
  
  // Hàm để cập nhật UI
  const forceRerender = () => {
    forceUpdate({});
  };

  // Thiết lập effect để theo dõi bàn phím
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', 
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Theo dõi thay đổi của coupon, discount và cartSummary.totalPrice
  useEffect(() => {
    if (coupon) {
      console.log('🧮 Thông tin giảm giá khi có thay đổi:');
      console.log('- Tổng tiền gốc:', cartSummary.totalPrice);
      console.log('- Mã giảm giá:', coupon.code);
      console.log('- Phần trăm giảm:', coupon.promotion + '%');
      console.log('- Giá trị giảm hiện tại:', discount);
      
      // Tính lại giá trị giảm theo phần trăm của coupon
      const calculatedDiscount = Math.round((cartSummary.totalPrice * parseInt(coupon.promotion)) / 100);
      console.log('- Giá trị giảm tính lại:', calculatedDiscount);
      console.log('- Giá cuối cùng:', cartSummary.totalPrice - calculatedDiscount);
    }
  }, [coupon, discount, cartSummary.totalPrice]);

  // Cập nhật giá đã giảm khi có thay đổi trong coupon, discount hoặc tổng tiền
  useEffect(() => {
    if (coupon && discount > 0) {
      // Tính giá sau khi giảm
      const newDiscountedPrice = Math.max(0, cartSummary.totalPrice - discount);
      console.log('🧮 Cập nhật giá đã giảm:', newDiscountedPrice);
      setDiscountedPrice(newDiscountedPrice);
    } else {
      // Nếu không có mã giảm giá, giá đã giảm = giá gốc
      setDiscountedPrice(cartSummary.totalPrice);
    }
  }, [coupon, discount, cartSummary.totalPrice]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  };

  const handleQuantityChange = async (id_cart: string, currentCount: number, newCount: number) => {
    if (newCount < 1) return;

    // Find the cart item to get product info
    const cartItem = cartItems.find(item => item.id_cart === id_cart);
    if (!cartItem) return;

    try {
      // Get current product inventory
      const product = await productService.getProductDetail(cartItem.id_product);
      if (product && product.inventory) {
        const availableInventory = product.inventory[cartItem.size as 'S' | 'M' | 'L'] || 0;
        
        if (newCount > availableInventory) {
          Alert.alert(
            'Vượt quá số lượng trong kho',
            `Chỉ còn ${availableInventory} sản phẩm size ${cartItem.size} trong kho.`
          );
          return;
        }
      }

      const success = await updateQuantity(id_cart, newCount);
      if (!success) {
        Alert.alert('Lỗi', 'Không thể cập nhật số lượng');
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      Alert.alert('Lỗi', 'Không thể kiểm tra số lượng trong kho');
    }
  };

  const handleRemoveItem = (id_cart: string, productName: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa "${productName}" khỏi giỏ hàng?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromCart(id_cart);
            if (!success) {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
            }
          }
        }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Xác nhận xóa tất cả',
      'Bạn có muốn xóa tất cả sản phẩm khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            const success = await clearCart();
            if (!success) {
              Alert.alert('Lỗi', 'Không thể xóa giỏ hàng');
            }
          }
        }
      ]
    );
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để tiếp tục thanh toán',
        [
          { text: 'Tiếp tục không đăng nhập', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => router.push('/(auth)/sign-in')
          }
        ]
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán');
      return;
    }

    // Navigate to checkout page
    router.push('/checkout/' as any);
  };
  
  const handleApplyCoupon = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để sử dụng mã giảm giá',
        [
          { text: 'Tiếp tục không đăng nhập', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => router.push('/(auth)/sign-in')
          }
        ]
      );
      return;
    }
    
    if (!couponCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã giảm giá');
      return;
    }
    
    setApplyingCoupon(true);
    
    try {
      // Gọi API áp dụng mã giảm giá
      const result = await applyCoupon(couponCode.trim(), user?._id || '');
      
      if (result.success) {
        // Cập nhật UI và xóa mã nhập vào
        setCouponCode('');
        
        // Làm mới giỏ hàng
        await refreshCart();
        
        // Tính toán giá đã giảm ngay lập tức nếu có thông tin coupon mới
        if (coupon) {
          const discountAmount = Math.round((cartSummary.totalPrice * parseInt(coupon.promotion)) / 100);
          setDiscountedPrice(Math.max(0, cartSummary.totalPrice - discountAmount));
        }
        
        // Buộc UI cập nhật
        forceRerender();
        
        // Hiển thị thông báo thành công
        Alert.alert('Thành công', result.message);
      } else {
        // Hiển thị thông báo lỗi với tiêu đề phù hợp
        if (result.message.includes('đã sử dụng')) {
          Alert.alert(
            'Mã giảm giá đã sử dụng',
            result.message,
            [{ text: 'Đã hiểu' }]
          );
        } else {
          Alert.alert('Lỗi', result.message);
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể áp dụng mã giảm giá');
    } finally {
      setApplyingCoupon(false);
    }
  };
  
  const handleRemoveCoupon = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có muốn xóa mã giảm giá đã áp dụng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Xóa mã giảm giá
              await removeCoupon();
              
              // Đặt lại giá thành giá gốc ngay lập tức
              setDiscountedPrice(cartSummary.totalPrice);
              
              // Làm mới giỏ hàng
              await refreshCart();
              
              // Đặt lại giá thành giá gốc một lần nữa sau khi refresh
              setDiscountedPrice(cartSummary.totalPrice);
              
              // Buộc UI cập nhật
              forceRerender();
              
              // Hiển thị thông báo thành công
              Alert.alert('Thành công', 'Đã xóa mã giảm giá');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa mã giảm giá');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const renderCartItem = (item: CartItem) => (
    <View key={item.id_cart} style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name_product}
        </Text>
        <Text style={styles.productSize}>Size: {item.size}</Text>
        <Text style={styles.productPrice}>
          {formatPrice(item.price_product)}
        </Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id_cart, item.count, item.count - 1)}
        >
          <Ionicons name="remove" size={16} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.count}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id_cart, item.count, item.count + 1)}
        >
          <Ionicons name="add" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id_cart, item.name_product)}
      >
        <Ionicons name="trash-outline" size={20} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

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

  // Tính toán giá cuối cùng một cách chính xác
  const calculateFinalPrice = () => {
    console.log('=== Tính toán giá cuối cùng ===');
    console.log('Tổng tiền gốc:', cartSummary.totalPrice);
    console.log('Có mã giảm giá:', !!coupon);
    console.log('Giá trị giảm:', discount);
    console.log('FinalPrice từ context:', finalPrice);
    
    if (coupon && discount > 0) {
      const calculatedFinalPrice = Math.max(0, cartSummary.totalPrice - discount);
      console.log('Giá cuối cùng đã tính:', calculatedFinalPrice);
      return calculatedFinalPrice;
    }
    console.log('Giá cuối cùng (không giảm):', cartSummary.totalPrice);
    return cartSummary.totalPrice;
  };

  // Tính toán giá ngay khi component render và mỗi khi các giá trị phụ thuộc thay đổi
  const displayFinalPrice = useMemo(() => calculateFinalPrice(), [cartSummary.totalPrice, coupon, discount]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >
      <SafeAreaView style={[styles.container, { flex: 1 }]}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng ({cartSummary.totalItems})</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
              <Ionicons name="trash-outline" size={20} color="#dc3545" />
            </TouchableOpacity>
          )}
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="bag-outline" size={80} color="#ccc" />
            <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
            <Text style={styles.emptyCartSubtext}>Hãy thêm sản phẩm vào giỏ hàng của bạn</Text>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => router.push('/products')}
            >
              <Text style={styles.shopNowButtonText}>Mua sắm ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* Cart Items */}
            <ScrollView 
              style={styles.cartItems}
              contentContainerStyle={{ 
                paddingBottom: keyboardVisible ? 20 : 0
              }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              keyboardShouldPersistTaps="handled"
            >
              {cartItems.map(renderCartItem)}
            </ScrollView>

            {/* Coupon Section */}
            <View style={[
              styles.couponSection,
              keyboardVisible && { backgroundColor: '#fff', borderTopWidth: 0 }
            ]}>
              {coupon ? (
                <View style={styles.appliedCoupon}>
                  <View style={styles.couponInfo}>
                    <Text style={styles.couponCode}>Mã giảm giá: {coupon.code}</Text>
                    <Text style={styles.couponDiscount}>Giảm {coupon.promotion}%</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeCouponButton}
                    onPress={handleRemoveCoupon}
                  >
                    <Ionicons name="close-circle" size={24} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponInputContainer}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                      handleApplyCoupon();
                    }}
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    style={styles.applyCouponButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleApplyCoupon();
                    }}
                    disabled={applyingCoupon}
                  >
                    {applyingCoupon ? (
                      <ActivityIndicator size="small" color="#333" />
                    ) : (
                      <Text style={styles.applyCouponText}>Áp dụng</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Summary */}
            <View style={[
              styles.summary,
              keyboardVisible && { display: 'none' }
            ]}>
              <View style={styles.summaryRow} key={`summary-total-${Date.now()}`}>
                <Text style={styles.summaryLabel}>Tạm tính:</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(cartSummary.totalPrice || 0)}
                </Text>
              </View>
              
              {coupon && discount > 0 && (
                <View style={styles.summaryRow} key={`summary-discount-${Date.now()}`}>
                  <Text style={styles.summaryLabel}>Giảm giá:</Text>
                  <Text style={styles.discountValue}>
                    -{formatPrice(discount || 0)}
                  </Text>
                </View>
              )}
              
              <View style={styles.summaryRow} key={`summary-final-${Date.now()}`}>
                <Text style={styles.summaryLabel}>Tổng cộng:</Text>
                <Text style={styles.summaryTotal}>
                  {formatPrice(discountedPrice)}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.checkoutButton}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutButtonText}>
                  Thanh toán ({cartSummary.totalItems} sản phẩm)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopNowButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopNowButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItems: {
    flex: 1,
    padding: 15,
    flexGrow: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fe0000',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  couponSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  couponSectionInScroll: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 5,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
  },
  applyCouponButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  applyCouponText: {
    color: '#333',
    fontWeight: 'bold',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  couponDiscount: {
    fontSize: 14,
    color: '#28a745',
  },
  removeCouponButton: {
    padding: 5,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  discountValue: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#fed700',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 