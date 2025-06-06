import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Alert,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { checkFavorite, toggleFavorite } from '../services/favoriteService';

interface FavoriteButtonProps {
  productId: string;
  size?: number;
  style?: ViewStyle;
  iconColor?: string;
  activeIconColor?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({
  productId,
  size = 24,
  style,
  iconColor = '#666',
  activeIconColor = '#ff6b6b',
  onToggle,
}: FavoriteButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?._id && productId) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, user?._id, productId]);

  const checkFavoriteStatus = async () => {
    try {
      if (!user?._id) return;
      
      const favorite = await checkFavorite(user._id, productId);
      setIsFavorite(favorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Đăng nhập',
        'Vui lòng đăng nhập để thêm sản phẩm vào yêu thích',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => {
            // Navigate to login - will be handled by parent component
          }}
        ]
      );
      return;
    }

    if (!user?._id) return;

    try {
      setLoading(true);
      
      const result = await toggleFavorite(user._id, productId);
      
      if (result.success) {
        setIsFavorite(result.isFavorite);
        onToggle?.(result.isFavorite);
        
        // Show success message
        const message = result.isFavorite 
          ? 'Đã thêm vào yêu thích' 
          : 'Đã xóa khỏi yêu thích';
        
        Alert.alert('Thành công', message);
      } else {
        Alert.alert('Lỗi', result.message);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi trạng thái yêu thích');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleToggleFavorite}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? activeIconColor : iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
}); 