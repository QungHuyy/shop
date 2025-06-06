import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import favoriteService, { FavoriteItem } from '@/services/favoriteService';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?._id) {
        loadFavorites();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated, user?._id])
  );

  const loadFavorites = async () => {
    try {
      if (!user?._id) return;
      
      setLoading(true);
      const favoritesData = await favoriteService.getFavorites(user._id);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (productId: string) => {
    if (!user?._id) return;

    Alert.alert(
      'Xác nhận',
      'Bạn có muốn xóa sản phẩm này khỏi danh sách yêu thích?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await favoriteService.removeFavorite(user._id!, productId);
              if (result.success) {
                // Cập nhật danh sách local
                setFavorites(prev => prev.filter(item => item.id_product._id !== productId));
                Alert.alert('Thành công', result.message);
              } else {
                Alert.alert('Lỗi', result.message);
              }
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm khỏi yêu thích');
            }
          }
        }
      ]
    );
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/products/[id]',
      params: { id: productId }
    } as any);
  };

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

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
    <TouchableOpacity 
      style={styles.favoriteItem}
      onPress={() => handleProductPress(item.id_product._id)}
    >
      <Image
        source={{ uri: item.id_product.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.id_product.name_product}
        </Text>
        <Text style={styles.productDescription} numberOfLines={1}>
          {item.id_product.describe}
        </Text>
        {formatPrice(
          item.id_product.price_product, 
          item.id_product.promotion, 
          item.id_product.salePrice
        )}
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleProductPress(item.id_product._id)}
          >
            <Text style={styles.viewButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item.id_product._id)}
          >
            <Ionicons name="heart-dislike" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
      <Text style={styles.emptySubtitle}>
        Hãy thêm những sản phẩm bạn yêu thích để dễ dàng tìm lại sau này
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/(tabs)' as any)}
      >
        <Text style={styles.shopButtonText}>Khám phá sản phẩm</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginRequired = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="person-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Đăng nhập để xem yêu thích</Text>
      <Text style={styles.emptySubtitle}>
        Vui lòng đăng nhập để xem danh sách sản phẩm yêu thích của bạn
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/(auth)/sign-in')}
      >
        <Text style={styles.shopButtonText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yêu thích</Text>
        </View>
        {renderLoginRequired()}
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yêu thích</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fed700" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length} sản phẩm
        </Text>
      </View>

      {/* Content */}
      {favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#fed700']}
              tintColor={'#fed700'}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  favoriteItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fed700',
    marginBottom: 8,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  promotionBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promotionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  viewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#fed700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 