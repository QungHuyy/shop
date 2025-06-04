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
  Dimensions,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Product } from '../../services/productService';
import commentService, { Comment, CreateCommentData, ReviewCheckResponse } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import cartService from '../../services/cartService';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartSummary } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Review states - sử dụng real API
  const [comments, setComments] = useState<Comment[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  console.log('🎯 ProductDetail component loaded with ID:', id);

  useEffect(() => {
    if (id) {
      console.log('📥 Starting to load product detail for ID:', id);
      loadProductDetail(id as string);
      loadProductReviews(id as string);
      
      // Kiểm tra quyền review nếu user đã đăng nhập
      if (isAuthenticated && user?._id) {
        checkReviewPermission(id as string, user._id);
      }
    }
  }, [id, isAuthenticated, user]);

  const loadProductDetail = async (productId: string) => {
    try {
      setLoading(true);
      const productData = await productService.getProductDetail(productId);
      
      if (productData) {
        setProduct(productData);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy sản phẩm', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadProductReviews = async (productId: string) => {
    try {
      setReviewsLoading(true);
      const reviewsData = await commentService.getComments(productId);
      setComments(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkReviewPermission = async (productId: string, userId: string) => {
    try {
      const result = await commentService.checkCanReview(productId, userId);
      setCanReview(result.canReview);
      setReviewMessage(result.message);
    } catch (error) {
      console.error('Error checking review permission:', error);
      setCanReview(false);
      setReviewMessage('Không thể kiểm tra quyền đánh giá');
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated || !user?._id) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để đánh giá sản phẩm');
      return;
    }

    if (!canReview) {
      Alert.alert('Thông báo', reviewMessage);
      return;
    }

    if (newComment.trim().length < 10) {
      Alert.alert('Lỗi', 'Đánh giá phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setSubmittingReview(true);
      
      const commentData: CreateCommentData = {
        id_user: user._id,
        content: newComment.trim(),
        star: newRating
      };

      const result = await commentService.createComment(id as string, commentData);
      
      if (result.success) {
        Alert.alert('Thành công', result.message);
        
        // Reset form
        setNewComment('');
        setNewRating(5);
        setShowReviewForm(false);
        
        // Reload comments
        await loadProductReviews(id as string);
        
        // Disable review permission (user can only review once)
        setCanReview(false);
        setReviewMessage('Bạn đã đánh giá sản phẩm này rồi');
      } else {
        Alert.alert('Lỗi', result.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(typeof price === 'string' ? parseInt(price) : price);
  };

  const calculateSalePrice = (originalPrice: string, promotion: number) => {
    const price = parseInt(originalPrice);
    return price - (price * promotion / 100);
  };

  const getSizeInventory = (size: 'S' | 'M' | 'L') => {
    return product?.inventory[size] || 0;
  };

  const isAvailableSize = (size: 'S' | 'M' | 'L') => {
    return getSizeInventory(size) > 0;
  };

  const getAverageRating = () => {
    return commentService.calculateAverageRating(comments);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/sign-in') }
      ]);
      return;
    }

    if (!selectedSize) {
      Alert.alert('Chọn size', 'Vui lòng chọn size sản phẩm');
      return;
    }

    if (!isAvailableSize(selectedSize)) {
      Alert.alert('Hết hàng', 'Size này đã hết hàng');
      return;
    }

    if (!product) {
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng');
      return;
    }

    // Check inventory before adding
    const availableQuantity = getSizeInventory(selectedSize);
    
    // Get existing cart items for this product + size
    const cartItems = await cartService.getCartItems();
    const existingItem = cartItems.find((item: any) => 
      item.id_product === product._id && item.size === selectedSize
    );
    const existingQuantity = existingItem ? existingItem.count : 0;
    const totalQuantity = existingQuantity + quantity;

    if (totalQuantity > availableQuantity) {
      Alert.alert(
        'Vượt quá số lượng trong kho', 
        `Chỉ còn ${availableQuantity} sản phẩm size ${selectedSize} trong kho.\nBạn đã có ${existingQuantity} trong giỏ hàng.\nChỉ có thể thêm tối đa ${availableQuantity - existingQuantity} sản phẩm nữa.`
      );
      return;
    }

    try {
      const cartData = {
        id_product: product._id,
        name_product: product.name_product,
        price_product: product.promotion && product.promotion > 0 
          ? calculateSalePrice(product.price_product, product.promotion)
          : parseInt(product.price_product),
        count: quantity,
        image: product.image,
        size: selectedSize,
        originalPrice: product.promotion && product.promotion > 0 
          ? parseInt(product.price_product) 
          : undefined
      };

      const success = await addToCart(cartData);
      
      if (success) {
        Alert.alert('Thành công', `Đã thêm ${quantity} ${product.name_product} (Size ${selectedSize}) vào giỏ hàng`, [
          { text: 'Tiếp tục mua', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => router.push('../../cart/') }
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để mua hàng', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/sign-in') }
      ]);
      return;
    }

    if (!selectedSize) {
      Alert.alert('Chọn size', 'Vui lòng chọn size sản phẩm');
      return;
    }

    if (!isAvailableSize(selectedSize)) {
      Alert.alert('Hết hàng', 'Size này đã hết hàng');
      return;
    }

    // TODO: Navigate to checkout
    Alert.alert('Mua ngay', `Chuyển đến trang thanh toán cho ${product?.name_product} (Size ${selectedSize})`);
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color="#ffa502"
        />
      );
    }
    return stars;
  };

  const renderReviewItem = ({ item }: { item: Comment }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {item.id_user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewUserName}>{item.id_user?.fullname || 'Người dùng ẩn danh'}</Text>
          <View style={styles.reviewRating}>
            {renderStars(item.star, 14)}
            <Text style={styles.reviewDate}>
              {commentService.formatDate(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.content}</Text>
    </View>
  );

  const renderReviewForm = () => (
    <View style={styles.reviewForm}>
      <Text style={styles.reviewFormTitle}>Đánh giá sản phẩm</Text>
      
      {!canReview && (
        <View style={styles.reviewWarning}>
          <Ionicons name="information-circle" size={20} color="#ff6b35" />
          <Text style={styles.reviewWarningText}>{reviewMessage}</Text>
        </View>
      )}
      
      <View style={styles.ratingSelector}>
        <Text style={styles.ratingLabel}>Đánh giá của bạn:</Text>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => canReview && setNewRating(star)}
              disabled={!canReview}
            >
              <Ionicons
                name={star <= newRating ? 'star' : 'star-outline'}
                size={24}
                color={canReview ? "#ffa502" : "#ccc"}
                style={styles.ratingStar}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={[styles.commentInput, !canReview && styles.commentInputDisabled]}
        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (ít nhất 10 ký tự)"
        value={newComment}
        onChangeText={setNewComment}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={canReview}
      />

      <View style={styles.reviewFormActions}>
        <TouchableOpacity
          style={styles.cancelReviewButton}
          onPress={() => {
            setShowReviewForm(false);
            setNewComment('');
            setNewRating(5);
          }}
        >
          <Text style={styles.cancelReviewText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitReviewButton,
            (!canReview || submittingReview) && styles.submitReviewButtonDisabled
          ]}
          onPress={submitReview}
          disabled={!canReview || submittingReview}
        >
          {submittingReview ? (
            <ActivityIndicator size="small" color="#333" />
          ) : (
            <Text style={styles.submitReviewText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => router.push('/(tabs)/cart')}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          {product.promotion && product.promotion > 0 && (
            <View style={styles.promotionBadge}>
              <Text style={styles.promotionText}>-{product.promotion}%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name_product}</Text>
          
          <View style={styles.priceContainer}>
            {product.promotion && product.promotion > 0 ? (
              <>
                <Text style={styles.salePrice}>
                  {formatPrice(calculateSalePrice(product.price_product, product.promotion))}
                </Text>
                <Text style={styles.originalPrice}>
                  {formatPrice(product.price_product)}
                </Text>
              </>
            ) : (
              <Text style={styles.price}>
                {formatPrice(product.price_product)}
              </Text>
            )}
          </View>

          {/* Rating & Reviews Summary */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingInfo}>
              {renderStars(Math.round(parseFloat(getAverageRating())), 16)}
              <Text style={styles.ratingValue}>
                {getAverageRating()} ({comments.length} đánh giá)
              </Text>
            </View>
            {isAuthenticated && (
              <TouchableOpacity 
                style={[
                  styles.addReviewButton,
                  !canReview && styles.addReviewButtonDisabled
                ]}
                onPress={() => {
                  if (canReview) {
                    setShowReviewForm(!showReviewForm);
                  } else {
                    Alert.alert('Thông báo', reviewMessage);
                  }
                }}
              >
                <Text style={[
                  styles.addReviewText,
                  !canReview && styles.addReviewTextDisabled
                ]}>
                  {canReview ? 'Viết đánh giá' : 'Không thể đánh giá'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Product Meta */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {product.gender === 'Male' ? 'Nam' : product.gender === 'Female' ? 'Nữ' : 'Unisex'}
              </Text>
            </View>
          </View>

          {/* Size Selection */}
          <View style={styles.sizeSection}>
            <Text style={styles.sectionTitle}>Chọn size</Text>
            <View style={styles.sizeContainer}>
              {(['S', 'M', 'L'] as const).map((size) => {
                const inventory = getSizeInventory(size);
                const isAvailable = isAvailableSize(size);
                const isSelected = selectedSize === size;
                
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      isSelected && styles.sizeButtonSelected,
                      !isAvailable && styles.sizeButtonDisabled,
                    ]}
                    onPress={() => isAvailable && setSelectedSize(size)}
                    disabled={!isAvailable}
                  >
                    <Text style={[
                      styles.sizeButtonText,
                      isSelected && styles.sizeButtonTextSelected,
                      !isAvailable && styles.sizeButtonTextDisabled,
                    ]}>
                      {size}
                    </Text>
                    <Text style={[
                      styles.sizeInventory,
                      !isAvailable && styles.sizeInventoryEmpty,
                    ]}>
                      {isAvailable ? `(${inventory})` : '(Hết)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Số lượng</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const newQuantity = Math.max(1, quantity - 1);
                  setQuantity(newQuantity);
                }}
              >
                <Ionicons name="remove" size={20} color="#333" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const maxQuantity = selectedSize ? getSizeInventory(selectedSize) : 1;
                  const newQuantity = Math.min(maxQuantity, quantity + 1);
                  setQuantity(newQuantity);
                }}
              >
                <Ionicons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            {selectedSize && (
              <Text style={styles.quantityHint}>
                Còn lại: {getSizeInventory(selectedSize)} sản phẩm
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>
              {product.describe || 'Chưa có mô tả cho sản phẩm này.'}
            </Text>
          </View>
        </View>

        {/* Review Form */}
        {showReviewForm && renderReviewForm()}

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>
              Đánh giá sản phẩm ({comments.length})
            </Text>
          </View>
          
          {reviewsLoading ? (
            <View style={styles.reviewsLoading}>
              <ActivityIndicator size="small" color="#fed700" />
              <Text style={styles.reviewsLoadingText}>Đang tải đánh giá...</Text>
            </View>
          ) : comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noReviews}>
              <Ionicons name="chatbox-outline" size={32} color="#ccc" />
              <Text style={styles.noReviewsText}>Chưa có đánh giá nào</Text>
              <Text style={styles.noReviewsSubtext}>Hãy là người đầu tiên đánh giá sản phẩm này!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fed700" />
          <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>Mua ngay</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  productImage: {
    width: width,
    height: width * 0.8,
    resizeMode: 'cover',
  },
  promotionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promotionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fe0000',
  },
  salePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fe0000',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  sizeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sizeContainer: {
    flexDirection: 'row',
  },
  sizeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sizeButtonSelected: {
    borderColor: '#fed700',
    backgroundColor: '#fed700',
  },
  sizeButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sizeButtonTextSelected: {
    color: '#fff',
  },
  sizeButtonTextDisabled: {
    color: '#999',
  },
  sizeInventory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sizeInventoryEmpty: {
    color: '#ff4757',
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  quantityHint: {
    fontSize: 12,
    color: '#666',
    marginLeft: 24,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fed700',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  addToCartText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fed700',
  },
  buyNowButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#fed700',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  addReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fed700',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  addReviewButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  addReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fed700',
  },
  addReviewTextDisabled: {
    color: '#999',
  },
  reviewsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewsLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  reviewsLoadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#fed700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginLeft: 52,
  },
  reviewForm: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  reviewWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b35',
  },
  reviewWarningText: {
    fontSize: 14,
    color: '#ff6b35',
    marginLeft: 8,
    flex: 1,
  },
  ratingSelector: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ratingStar: {
    marginHorizontal: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  commentInputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  reviewFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelReviewButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fed700',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelReviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fed700',
  },
  submitReviewButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#fed700',
    alignItems: 'center',
  },
  submitReviewButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  submitReviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4757',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 