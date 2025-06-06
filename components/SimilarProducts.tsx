import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import ProductCard from './ProductCard';
import productService, { Product } from '../services/productService';

interface SimilarProductsProps {
  productId: string;
  categoryId?: string;
  gender?: string;
}

const SimilarProducts = ({ productId, categoryId, gender }: SimilarProductsProps) => {
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadSimilarProducts();
  }, [productId]);

  const loadSimilarProducts = async () => {
    try {
      setLoading(true);
      const products = await productService.getSimilarProducts(productId);
      setSimilarProducts(products);
    } catch (error) {
      console.error('Error loading similar products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/products/${product._id}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sản phẩm tương tự</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (similarProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sản phẩm tương tự</Text>
      <FlatList
        horizontal
        data={similarProducts}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <ProductCard
              product={item}
              style={styles.productCard}
              imageStyle={styles.productImage}
              showFavorite={false}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  listContent: {
    paddingRight: 16,
  },
  productCard: {
    width: 150,
    marginRight: 12,
  },
  productImage: {
    height: 150,
  },
});

export default SimilarProducts; 