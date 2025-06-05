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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import imageSearchService, { ImageSearchResult } from '../../services/imageSearchService';

export default function ImageSearchScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchedImage, setSearchedImage] = useState<string>('');

  useEffect(() => {
    if (imageUri) {
      setSearchedImage(imageUri);
      performImageSearch(imageUri);
    }
  }, [imageUri]);

  const performImageSearch = async (uri: string) => {
    try {
      setLoading(true);
      console.log('🚀 Starting image search with URI:', uri);
      
      const results = await imageSearchService.searchByImage(uri);
      console.log('📊 Search completed, results count:', results.length);
      
      // Filter chỉ hiển thị sản phẩm có độ tương đồng > 30%
      const filteredResults = results.filter(product => 
        product.similarity && product.similarity > 30
      );
      
      console.log('🔍 Filtered results (>30% similarity):', filteredResults.length);
      setSearchResults(filteredResults);
    } catch (error: any) {
      console.error('💥 Image search failed:', error);
      Alert.alert(
        'Lỗi tìm kiếm', 
        error.message || 'Không thể tìm kiếm bằng hình ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    console.log('📱 Navigating to product detail:', productId);
    router.push(`/products/${productId}` as any);
  };

  const handleRetakePhoto = async () => {
    const newImageUri = await imageSearchService.showImageSourceOptions();
    if (newImageUri) {
      setSearchedImage(newImageUri);
      performImageSearch(newImageUri);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal'
    }).format(price) + ' VNĐ';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm bằng hình ảnh</Text>
        <TouchableOpacity onPress={handleRetakePhoto} style={styles.retakeButton}>
          <Ionicons name="camera-outline" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Searched Image */}
        {searchedImage && (
          <View style={styles.searchedImageContainer}>
            <Text style={styles.sectionTitle}>Hình ảnh tìm kiếm:</Text>
            <View style={styles.searchedImageWrapper}>
              <Image source={{ uri: searchedImage }} style={styles.searchedImage} />
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Đang phân tích hình ảnh bằng AI...</Text>
            <Text style={styles.loadingSubtext}>Tìm kiếm sản phẩm tương tự</Text>
          </View>
        )}

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>
              Tìm thấy {searchResults.length} sản phẩm tương tự:
            </Text>
            <View style={styles.productsGrid}>
              {searchResults.map((product, index) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.productCard}
                  onPress={() => handleProductPress(product._id)}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    {product.similarity && (
                      <View style={[
                        styles.similarityBadge,
                        {
                          backgroundColor: product.similarity >= 80 ? '#28a745' : 
                                         product.similarity >= 60 ? '#ffc107' : '#6c757d'
                        }
                      ]}>
                        <Text style={styles.similarityText}>{product.similarity}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name_product}
                    </Text>
                    <Text style={styles.productPrice}>
                      {formatPrice(product.price_product)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* No Results */}
        {!loading && searchResults.length === 0 && searchedImage && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <Text style={styles.noResultsText}>
              Không tìm thấy sản phẩm tương tự
            </Text>
            <Text style={styles.noResultsSubtext}>
              Hãy thử chụp ảnh khác hoặc chọn ảnh rõ ràng hơn
            </Text>
            <TouchableOpacity onPress={handleRetakePhoto} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 44,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  retakeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchedImageContainer: {
    marginBottom: 24,
  },
  searchedImageWrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  searchedImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  resultsContainer: {
    marginTop: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  similarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  similarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 