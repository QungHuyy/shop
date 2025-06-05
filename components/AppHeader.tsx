import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';
import imageSearchService from '@/services/imageSearchService';

interface AppHeaderProps {
  showCart?: boolean;
  showCamera?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  showChatbot?: boolean;
}

export default function AppHeader({ 
  showCart = true, 
  showCamera = true, 
  showSearch = true,
  showNotification = true,
  showChatbot = true
}: AppHeaderProps) {
  const router = useRouter();
  const { cartSummary } = useCart();
  const { summary } = useNotification();

  const handleCartPress = () => {
    console.log('Cart button pressed');
    // Navigate to cart tab
    router.push('/cart');
  };

  const handleNotificationPress = () => {
    // @ts-ignore - Dynamic route will work at runtime
    router.push('/notifications');
  };

  const handleCameraPress = async () => {
    try {
      console.log('Camera button pressed - starting image search');
      const imageUri = await imageSearchService.showImageSourceOptions();
      
      if (imageUri) {
        console.log('Image selected:', imageUri);
        // Navigate to image search screen with the selected image
        router.push({
          pathname: '/image-search',
          params: { imageUri }
        } as any);
      }
    } catch (error) {
      console.error('Error in camera press:', error);
    }
  };

  const handleChatbotPress = () => {
    console.log('Chatbot button pressed');
    router.push('/chatbot' as any);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://res.cloudinary.com/dwmsfixy5/image/upload/v1748992588/1_qrtmcd.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Search bar */}
        {showSearch && (
          <TouchableOpacity style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#666" />
            <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm</Text>
          </TouchableOpacity>
        )}

        {/* Header icons */}
        <View style={styles.headerIcons}>
          {showCamera && (
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={handleCameraPress}
            >
              <Ionicons name="camera-outline" size={22} color="#333" />
            </TouchableOpacity>
          )}
          
          {showChatbot && (
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={handleChatbotPress}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#333" />
            </TouchableOpacity>
          )}
          
          {showNotification && (
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={22} color="#333" />
              {summary?.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {summary.unread > 99 ? '99+' : summary.unread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {showCart && (
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={handleCartPress}
            >
              <Ionicons name="bag-outline" size={22} color="#333" />
              {cartSummary?.totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fed700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginRight: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#999',
    fontSize: 14,
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    position: 'relative',
    marginLeft: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
}); 