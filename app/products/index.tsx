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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import productService, { Product } from '@/services/productService';

const { width } = Dimensions.get('window');

// Filter interfaces
interface PriceRange {
  min: number;
  max: number;
  label: string;
}

interface FilterOptions {
  priceRange: PriceRange | null;
  hasPromotion: boolean | null; // true = có km, false = không km, null = tất cả
  sortBy: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'promotion_desc' | 'default';
}

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: null,
    hasPromotion: null,
    sortBy: 'default'
  });

  // Price ranges
  const priceRanges: PriceRange[] = [
    { min: 0, max: 500000, label: 'Dưới 500K' },
    { min: 500000, max: 1000000, label: '500K - 1M' },
    { min: 1000000, max: 2000000, label: '1M - 2M' },
    { min: 2000000, max: 99999999, label: 'Trên 2M' },
  ];

  // Sort options
  const sortOptions = [
    { key: 'default', label: 'Mặc định' },
    { key: 'price_asc', label: 'Giá thấp → cao' },
    { key: 'price_desc', label: 'Giá cao → thấp' },
    { key: 'name_asc', label: 'Tên A → Z' },
    { key: 'name_desc', label: 'Tên Z → A' },
    { key: 'promotion_desc', label: 'Khuyến mãi cao nhất' },
  ];

  useEffect(() => {
    loadAllProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchText, selectedGender, filters]);

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

    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(product => {
        const price = parseInt(product.price_product);
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
      });
    }

    // Filter by promotion
    if (filters.hasPromotion !== null) {
      if (filters.hasPromotion) {
        filtered = filtered.filter(product => product.promotion && product.promotion > 0);
      } else {
        filtered = filtered.filter(product => !product.promotion || product.promotion === 0);
      }
    }

    // Sort products
    filtered = sortProducts(filtered, filters.sortBy);

    setFilteredProducts(filtered);
  };

  const sortProducts = (products: Product[], sortBy: string): Product[] => {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => {
          const priceA = a.salePrice || parseInt(a.price_product);
          const priceB = b.salePrice || parseInt(b.price_product);
          return priceA - priceB;
        });
      case 'price_desc':
        return sorted.sort((a, b) => {
          const priceA = a.salePrice || parseInt(a.price_product);
          const priceB = b.salePrice || parseInt(b.price_product);
          return priceB - priceA;
        });
      case 'name_asc':
        return sorted.sort((a, b) => a.name_product.localeCompare(b.name_product));
      case 'name_desc':
        return sorted.sort((a, b) => b.name_product.localeCompare(a.name_product));
      case 'promotion_desc':
        return sorted.sort((a, b) => (b.promotion || 0) - (a.promotion || 0));
      default:
        return sorted;
    }
  };

  const resetFilters = () => {
    setFilters({
      priceRange: null,
      hasPromotion: null,
      sortBy: 'default'
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllProducts();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    console.log('🔄 Navigating to product detail:', product._id, product.name_product);
    router.push(`/products/${product._id}`);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange) count++;
    if (filters.hasPromotion !== null) count++;
    if (filters.sortBy !== 'default') count++;
    return count;
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Bộ lọc</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
              {priceRanges.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    filters.priceRange?.label === range.label && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters(prev => ({
                    ...prev,
                    priceRange: prev.priceRange?.label === range.label ? null : range
                  }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.priceRange?.label === range.label && styles.filterOptionTextActive
                  ]}>
                    {range.label}
                  </Text>
                  {filters.priceRange?.label === range.label && (
                    <Ionicons name="checkmark" size={20} color="#fed700" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Promotion Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Khuyến mãi</Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.hasPromotion === true && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({
                  ...prev,
                  hasPromotion: prev.hasPromotion === true ? null : true
                }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.hasPromotion === true && styles.filterOptionTextActive
                ]}>
                  Có khuyến mãi
                </Text>
                {filters.hasPromotion === true && (
                  <Ionicons name="checkmark" size={20} color="#fed700" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.hasPromotion === false && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({
                  ...prev,
                  hasPromotion: prev.hasPromotion === false ? null : false
                }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.hasPromotion === false && styles.filterOptionTextActive
                ]}>
                  Không khuyến mãi
                </Text>
                {filters.hasPromotion === false && (
                  <Ionicons name="checkmark" size={20} color="#fed700" />
                )}
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.sortBy === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setFilters(prev => ({
                    ...prev,
                    sortBy: option.key as any
                  }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.sortBy === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {filters.sortBy === option.key && (
                    <Ionicons name="checkmark" size={20} color="#fed700" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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

      {/* Gender Filter + Filter Button */}
      <View style={styles.filterRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.genderFilterContainer}
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
                styles.filterChip,
                selectedGender === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedGender(filter.key)}
            >
              <Text style={[
                styles.filterChipText,
                selectedGender === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            getActiveFiltersCount() > 0 && styles.filterButtonActive
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={20} color={getActiveFiltersCount() > 0 ? "#fed700" : "#333"} />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Count & Active Filters */}
      <View style={styles.resultContainer}>
        <Text style={styles.countText}>
          {filteredProducts.length} sản phẩm
        </Text>
        {getActiveFiltersCount() > 0 && (
          <TouchableOpacity onPress={resetFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Xóa lọc</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {apiError && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color="#ff4757" />
          <Text style={styles.errorText} numberOfLines={2}>
            {apiError}
          </Text>
        </View>
      )}
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

      {renderFilterModal()}
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
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  genderFilterContainer: {
    marginRight: 10,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: 'white',
  },
  filterChipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fed700',
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'white',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  clearFiltersButton: {
    padding: 8,
    backgroundColor: '#ff4757',
    borderRadius: 15,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: 'white',
    width: '100%',
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    flex: 1,
    paddingVertical: 10,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    borderColor: '#fed700',
    backgroundColor: '#fff9e6',
  },
  filterOptionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fed700',
    fontWeight: 'bold',
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15,
  },
  resetButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fed700',
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 