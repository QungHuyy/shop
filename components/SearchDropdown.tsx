import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/services/productService';

const { width } = Dimensions.get('window');

interface SearchDropdownProps {
  products: Product[];
  onProductPress: (product: Product) => void;
  onSeeAllPress: (searchText: string) => void;
  searchText: string;
  visible: boolean;
  top?: number;
  left?: number;
  right?: number;
}

export default function SearchDropdown({
  products,
  onProductPress,
  onSeeAllPress,
  searchText,
  visible,
  top = 60,
  left = 16,
  right = 16,
}: SearchDropdownProps) {
  if (!visible || products.length === 0) {
    return null;
  }

  const formatPrice = (price: string, promotion?: number, salePrice?: number) => {
    if (promotion && promotion > 0 && salePrice) {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.salePrice}>
            {salePrice.toLocaleString('vi-VN')}đ
          </Text>
          <Text style={styles.originalPrice}>
            {parseInt(price).toLocaleString('vi-VN')}đ
          </Text>
          <View style={styles.promotionBadge}>
            <Text style={styles.promotionText}>-{promotion}%</Text>
          </View>
        </View>
      );
    }
    return (
      <Text style={styles.price}>
        {parseInt(price).toLocaleString('vi-VN')}đ
      </Text>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      style={({ pressed }) => [
        styles.productItem,
        pressed && styles.productItemPressed
      ]}
      onPress={() => {
        console.log('🔥 Product pressed in dropdown:', item._id, item.name_product);
        onProductPress(item);
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name_product}
        </Text>
        {formatPrice(item.price_product, item.promotion, item.salePrice)}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { top, left, right }]}>
      <FlatList
        data={products.slice(0, 5)} // Giới hạn tối đa 5 sản phẩm
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
      />
      
      {products.length > 5 && (
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => onSeeAllPress(searchText)}
        >
          <Text style={styles.seeAllText}>
            Xem tất cả {products.length} kết quả
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 9999,
  },
  productItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productItemPressed: {
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  salePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  promotionBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promotionText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
}); 