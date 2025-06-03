import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import productService, { Product, Category, SaleProduct } from '@/services/productService';

const { width } = Dimensions.get('window');

interface User {
  _id?: string;
  fullname?: string;
  email?: string;
  phone?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
  const [maleProducts, setMaleProducts] = useState<Product[]>([]);
  const [femaleProducts, setFemaleProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  // Banner data với thiết kế đẹp
  const banners = [
    {
      id: 1,
      image: 'https://img.freepik.com/premium-vector/flash-sale-50-off-banner-template-design-web-advertising-social-media_333987-1335.jpg',
  
    },
    {
      id: 2,
      image: 'https://static.vecteezy.com/system/resources/previews/044/637/679/non_2x/summer-sale-poster-or-banner-template-featuring-a-tropical-beach-scene-with-sun-and-party-elements-product-display-tropical-summer-scene-perfect-for-promoting-your-summer-products-on-blue-background-vector.jpg',
    },
    {
      id: 3,
      image: 'https://img.freepik.com/free-vector/gradient-sale-background_23-2149050986.jpg',

    },
  ];

  // Quick actions data
  const quickActions = [
    { id: 1, icon: '⚡', title: 'Flash Sale', color: '#ff4757', action: 'sale' },
    { id: 2, icon: '🎫', title: 'Voucher', color: '#ff6b35', action: 'voucher' },
    { id: 3, icon: '🔥', title: 'Hàng mới', color: '#fed700', action: 'new' },
    { id: 4, icon: '⭐', title: 'Bán chạy', color: '#ffa502', action: 'bestseller' },
  ];

  useEffect(() => {
    checkUserLoggedIn();
    loadData();

    // Auto slide banner
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra đăng nhập:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load data song song để tăng tốc độ
      const [categoriesData, saleData, maleData, femaleData, bestSellingData] = 
        await Promise.all([
          productService.getCategories(),
          productService.getSaleProducts(),
          productService.getProductsByGender('Male', 4),
          productService.getProductsByGender('Female', 4),
          productService.getBestSellingProducts(6)
        ]);

      setCategories(categoriesData);
      setSaleProducts(saleData);
      setMaleProducts(maleData);
      setFemaleProducts(femaleData);
      setProducts(bestSellingData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsModalVisible(false);
      Alert.alert('Thành công', 'Đã đăng xuất thành công!');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
    }
  };

  const handleQuickAction = (action: string) => {
    Alert.alert('Thông báo', `Bạn đã chọn: ${action}`);
    // TODO: Navigate to specific screens based on action
  };

  const handleProductPress = (product: Product | SaleProduct) => {
    Alert.alert('Sản phẩm', `Bạn đã chọn: ${product.name_product}`);
    // TODO: Navigate to product detail screen
  };

  const handleCategoryPress = (gender: string) => {
    Alert.alert('Danh mục', `Xem sản phẩm: ${gender}`);
    // TODO: Navigate to product list screen
  };

  const renderUserModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContent}>
          {user ? (
            <>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setIsModalVisible(false);
                  router.push('/profile/view');
                }}
              >
                <Text style={styles.modalOptionText}>👁️ Xem Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setIsModalVisible(false);
                  router.push('/profile/edit');
                }}
              >
                <Text style={styles.modalOptionText}>✏️ Cập nhật Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleLogout}
              >
                <Text style={styles.modalOptionText}>🚪 Đăng xuất</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setIsModalVisible(false);
                router.push('/sign-in');
              }}
            >
              <Text style={styles.modalOptionText}>🔑 Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>👔 Fashion</Text>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm...</Text>
        </TouchableOpacity>

        {/* Header icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="bag-outline" size={24} color="#333" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setIsModalVisible(true)}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderBanner = () => (
    <View style={styles.bannerContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentBanner(slideIndex);
        }}
      >
        {banners.map((banner) => (
          <TouchableOpacity key={banner.id} style={styles.bannerSlide}>
            <Image
              source={{ uri: banner.image }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                <TouchableOpacity style={styles.bannerButton}>
                  {/* <Text style={styles.bannerButtonText}>Mua ngay</Text> */}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.bannerIndicator}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentBanner && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity 
            key={action.id} 
            style={styles.quickAction}
            onPress={() => handleQuickAction(action.action)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
              <Text style={styles.quickActionEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoriesContainer}>
        <TouchableOpacity 
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('Nam')}
        >
          <Image
            source={{ uri: 'https://theme.hstatic.net/200000690725/1001078549/14/home_category_1_img.jpg?v=743' }}
            style={styles.categoryBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryTitle}>Nam</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('Nữ')}
        >
          <Image
            source={{ uri: 'https://res.cloudinary.com/dwmsfixy5/image/upload/v1748127256/unnamed_pj2cqe.png' }}
            style={styles.categoryBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryTitle}>Nữ</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('Unisex')}
        >
          <Image
            source={{ uri: 'https://res.cloudinary.com/dwmsfixy5/image/upload/v1748126928/Gemini_Generated_Image_ai6lq2ai6lq2ai6l_1_vp9k9b.png' }}
            style={styles.categoryBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryTitle}>Unisex</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaleProducts = () => {
    if (saleProducts.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Sản phẩm giảm giá</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={saleProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.saleProductCard}
              onPress={() => handleProductPress(item)}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.saleTag}>
                <Text style={styles.saleText}>-{item.promotion}%</Text>
              </View>
              <View style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={20} color="#ff4757" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name_product}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.salePrice}>
                    {productService.formatPrice(item.salePrice)}
                  </Text>
                  <Text style={styles.originalPrice}>
                    {productService.formatPrice(item.price_product)}
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>⭐ 4.5</Text>
                  <Text style={styles.soldCount}>Đã bán {item.number}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.productsList}
        />
      </View>
    );
  };

  const renderProductGrid = (title: string, products: Product[], icon: string = '') => {
    if (products.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{icon} {title}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.productGrid}>
          {products.map((product) => (
            <TouchableOpacity 
              key={product._id} 
              style={styles.gridProductCard}
              onPress={() => handleProductPress(product)}
            >
              <Image
                source={{ uri: product.image }}
                style={styles.gridProductImage}
                resizeMode="cover"
              />
              <View style={styles.gridFavoriteButton}>
                <Ionicons name="heart-outline" size={16} color="#ff4757" />
              </View>
              <View style={styles.gridProductInfo}>
                <Text style={styles.gridProductName} numberOfLines={2}>
                  {product.name_product}
                </Text>
                <Text style={styles.gridProductPrice}>
                  {productService.formatPrice(product.price_product)}
                </Text>
                <View style={styles.gridRatingContainer}>
                  <Text style={styles.gridRating}>⭐ 4.3</Text>
                  <Text style={styles.gridSoldCount}>{product.number} đã bán</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#666" />
      <Text style={styles.loadingText}>Đang tải...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        {renderHeader()}
        {renderLoading()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fed700" />
      
      {renderHeader()}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#fed700']}
            tintColor={'#fed700'}
          />
        }
      >
        {renderBanner()}
        {renderQuickActions()}
        {renderCategories()}
        {renderSaleProducts()}
        {renderProductGrid('Sản phẩm nam', maleProducts, '👨')}
        {renderProductGrid('Sản phẩm nữ', femaleProducts, '👩')}
        {renderProductGrid('Sản phẩm bán chạy', products, '⭐')}
      </ScrollView>
      
      {renderUserModal()}
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
    paddingVertical: 12,
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
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    position: 'relative',
    marginLeft: 12,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4757',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  bannerContainer: {
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerSlide: {
    width: width,
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#ffca00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bannerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bannerIndicator: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 28,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#242424',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    width: (width - 48) / 3,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  categoryBackgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  productsList: {
    paddingLeft: 16,
  },
  saleProductCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 180,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  saleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4757',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff0000',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#333',
  },
  soldCount: {
    fontSize: 10,
    color: '#666',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridProductCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: (width - 40) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  gridProductImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridFavoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridProductInfo: {
    padding: 12,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  gridProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 4,
  },
  gridRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRating: {
    fontSize: 12,
    color: '#333',
  },
  gridSoldCount: {
    fontSize: 10,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
}); 