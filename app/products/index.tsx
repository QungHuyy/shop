import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import productService, { Product } from '@/services/productService';
import { useCart } from '@/contexts/CartContext';
import { styles } from './styles';

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
  const { gender, filter } = useLocalSearchParams();
  const { cartSummary } = useCart();
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
    // Xử lý query parameters từ navigation
    if (gender && typeof gender === 'string') {
      console.log('Setting gender filter:', gender);
      setSelectedGender(gender);
    }
    
    if (filter && typeof filter === 'string') {
      console.log('Setting filter:', filter);
      if (filter === 'sale') {
        setFilters(prev => ({ ...prev, hasPromotion: true }));
      } else if (filter === 'bestseller') {
        setFilters(prev => ({ ...prev, sortBy: 'promotion_desc' }));
      } else if (filter === 'new') {
        // Có thể thêm logic cho sản phẩm mới
        setFilters(prev => ({ ...prev, sortBy: 'default' }));
      }
    }
  }, [gender, filter]);

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

  const getHeaderTitle = () => {
    if (filter === 'sale') {
      return 'Sản phẩm giảm giá';
    } else if (filter === 'bestseller') {
      return 'Sản phẩm bán chạy';
    } else if (filter === 'new') {
      return 'Sản phẩm mới';
    } else if (gender === 'Male') {
      return 'Sản phẩm nam';
    } else if (gender === 'Female') {
      return 'Sản phẩm nữ';
    } else if (gender === 'Unisex') {
      return 'Sản phẩm Unisex';
    } else {
      return 'Tất cả sản phẩm';
    }
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

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Back button row */}
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <TouchableOpacity 
          style={styles.cartButton}
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