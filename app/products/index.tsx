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
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import productService, { Product } from '@/services/productService';

const { width } = Dimensions.get('window');

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    loadAllProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchText, selectedGender]);

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      console.log('Attempting to load products...');
      
      // Sử dụng API pagination để lấy sản phẩm
      const products = await productService.getProductsPagination(1, 50, '', 'all', 'all');
      
      console.log('Products loaded successfully:', products.length);
      setProducts(products);
      
      if (products.length === 0) {
        setApiError('Không có sản phẩm nào trong database');
      }
      
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Không thể kết nối tới server';
      setApiError(errorMessage);
      
      Alert.alert(
        'Lỗi kết nối', 
        `${errorMessage}\n\nĐang sử dụng dữ liệu mẫu thay thế.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by gender
    if (selectedGender !== 'all') {
      filtered = filtered.filter(product => product.gender === selectedGender);
    }

    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter(product =>
        product.name_product.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllProducts();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    Alert.alert('Sản phẩm', `Bạn đã chọn: ${product.name_product}`);
    // TODO: Navigate to product detail page
    // router.push(`/products/${product._id}`);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả sản phẩm</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchText('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Gender Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'Male', label: 'Nam' },
          { key: 'Female', label: 'Nữ' },
          { key: 'Unisex', label: 'Unisex' }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedGender === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedGender(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedGender === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredProducts.length} sản phẩm
        </Text>
        {apiError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#ff4757" />
            <Text style={styles.errorText} numberOfLines={2}>
              {apiError}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        {item.promotion && (
          <View style={styles.saleTag}>
            <Text style={styles.saleText}>-{item.promotion}%</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color="#ff4757" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name_product}
        </Text>
        
        {item.promotion && item.salePrice ? (
          <View style={styles.priceContainer}>
            <Text style={styles.salePrice}>
              {productService.formatPrice(item.salePrice)}
            </Text>
            <Text style={styles.originalPrice}>
              {productService.formatPrice(item.price_product)}
            </Text>
          </View>
        ) : (
          <Text style={styles.productPrice}>
            {productService.formatPrice(item.price_product)}
          </Text>
        )}
        
        <View style={styles.productMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#ffa502" />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
          <Text style={styles.soldCount}>
            Đã bán {item.number}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
      <Text style={styles.emptySubtitle}>
        Hãy thử tìm kiếm với từ khóa khác
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#fed700" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fed700" />
      
      {renderHeader()}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
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
        columnWrapperStyle={styles.row}
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
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: 'white',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fed700',
    fontWeight: 'bold',
  },
  countContainer: {
    alignItems: 'center',
  },
  countText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginLeft: 5,
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
  productsList: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: (width - 48) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  soldCount: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  saleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4757',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff0000',
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
}); 