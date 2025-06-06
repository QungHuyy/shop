import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/services/productService';
import productService from '@/services/productService';
import FavoriteButton from './FavoriteButton';

interface ProductCardProps {
  product: Product;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  variant?: 'grid' | 'horizontal'; // grid cho thẻ vuông, horizontal cho danh sách
  showFavorite?: boolean;
}

interface ProductStats {
  averageRating: number;
  totalReviews: number;
  totalSold: number;
}

export default function ProductCard({
  product,
  style,
  imageStyle,
  variant = 'grid',
  showFavorite = true,
}: ProductCardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<ProductStats>({
    averageRating: 0,
    totalReviews: 0,
    totalSold: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductStats();
  }, [product._id]);

  const loadProductStats = async () => {
    try {
      const productStats = await productService.getProductStats(product._id);
      setStats(productStats);
    } catch (error) {
      console.error('Error loading product stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    console.log('🔥 Product pressed:', product._id, product.name_product);
    router.push(`/products/${product._id}`);
  };

  const formatRating = (rating: number) => {
    if (rating === 0) return '0.0';
    return rating.toFixed(1);
  };

  const renderPrice = () => {
    if (product.promotion && product.salePrice) {
      return (
        <View style={variant === 'grid' ? styles.gridPriceContainer : styles.priceContainer}>
          <Text style={variant === 'grid' ? styles.gridSalePrice : styles.salePrice}>
            {productService.formatPrice(product.salePrice)}
          </Text>
          <Text style={variant === 'grid' ? styles.gridOriginalPrice : styles.originalPrice}>
            {productService.formatPrice(product.price_product)}
          </Text>
        </View>
      );
    }
    
    return (
      <Text style={variant === 'grid' ? styles.gridProductPrice : styles.productPrice}>
        {productService.formatPrice(product.price_product)}
      </Text>
    );
  };

  const renderRatingAndSold = () => {
    if (loading) {
      return (
        <View style={variant === 'grid' ? styles.gridRatingContainer : styles.ratingContainer}>
          <Text style={variant === 'grid' ? styles.gridRating : styles.rating}>⭐ --</Text>
          <Text style={variant === 'grid' ? styles.gridSoldCount : styles.soldCount}>-- đã bán</Text>
        </View>
      );
    }

    return (
      <View style={variant === 'grid' ? styles.gridRatingContainer : styles.ratingContainer}>
        <Text style={variant === 'grid' ? styles.gridRating : styles.rating}>
          ⭐ {formatRating(stats.averageRating)}
        </Text>
        <Text style={variant === 'grid' ? styles.gridSoldCount : styles.soldCount}>
          {stats.totalSold} đã bán
        </Text>
      </View>
    );
  };

  if (variant === 'grid') {
    return (
      <TouchableOpacity 
        style={[styles.gridProductCard, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={[styles.gridProductImage, imageStyle]}
            resizeMode="cover"
          />
          {product.promotion && (
            <View style={styles.gridSaleTag}>
              <Text style={styles.gridSaleText}>-{product.promotion}%</Text>
            </View>
          )}
          {showFavorite && (
            <View style={styles.gridFavoriteContainer}>
              <FavoriteButton 
                productId={product._id}
                size={16}
                style={styles.gridFavoriteButton}
              />
            </View>
          )}
        </View>
        
        <View style={styles.gridProductInfo}>
          <Text style={styles.gridProductName} numberOfLines={2}>
            {product.name_product}
          </Text>
          
          {renderPrice()}
          {renderRatingAndSold()}
        </View>
      </TouchableOpacity>
    );
  }

  // Horizontal variant for list view
  return (
    <TouchableOpacity 
      style={[styles.horizontalCard, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={[styles.horizontalImage, imageStyle]}
          resizeMode="cover"
        />
        {product.promotion && (
          <View style={styles.saleTag}>
            <Text style={styles.saleText}>-{product.promotion}%</Text>
          </View>
        )}
        {showFavorite && (
          <View style={styles.favoriteContainer}>
            <FavoriteButton 
              productId={product._id}
              size={20}
              style={styles.favoriteButton}
            />
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name_product}
        </Text>
        
        {renderPrice()}
        {renderRatingAndSold()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid variant styles
  gridProductCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 6,
    flex: 1,
  },
  gridProductImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridProductInfo: {
    padding: 12,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  gridPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  gridSalePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4757',
    marginRight: 8,
  },
  gridOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  gridProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4757', // Đổi thành màu đỏ
    marginBottom: 6,
  },
  gridRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRating: {
    fontSize: 12,
    color: '#666',
  },
  gridSoldCount: {
    fontSize: 12,
    color: '#999',
  },
  gridSaleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4757',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridSaleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridFavoriteContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gridFavoriteButton: {
    padding: 6,
  },

  // Horizontal variant styles
  horizontalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 8,
    width: 280,
    flex: 1, // Thêm flex để responsive
  },
  horizontalImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  salePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4757',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4757', // Đổi thành màu đỏ
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  soldCount: {
    fontSize: 14,
    color: '#999',
  },
  saleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Common styles
  imageContainer: {
    position: 'relative',
  },
  favoriteContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  favoriteButton: {
    padding: 8,
  },
}); 