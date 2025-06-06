import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import imageSearchService from '@/services/imageSearchService';
import productService, { Product } from '@/services/productService';
import SearchDropdown from './SearchDropdown';

interface AppHeaderProps {
  showCart?: boolean;
  showCamera?: boolean;
  showSearch?: boolean;
  showChatbot?: boolean;
}

export default function AppHeader({ 
  showCart = true, 
  showCamera = true, 
  showSearch = true,
  showChatbot = true
}: AppHeaderProps) {
  const router = useRouter();
  const { cartSummary } = useCart();
  
  // User state
  const [userName, setUserName] = useState<string>('');
  
  // Search states
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCartPress = () => {
    console.log('Cart button pressed');
    // Navigate to cart tab
    router.push('/cart');
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

  // Search functions
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (text.trim() === '') {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }
    
    // Set loading state
    setIsSearching(true);
    setShowSearchDropdown(true);
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔍 Searching for:', text);
        const results = await productService.searchProducts(text, 10);
        console.log('✅ Search results:', results.length, 'products found');
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0); // Auto show dropdown when results found
        setIsSearching(false);
      } catch (error) {
        console.error('❌ Search error:', error);
        setSearchResults([]);
        setShowSearchDropdown(false);
        setIsSearching(false);
      }
    }, 300); // 300ms delay
  };

  const handleSearchFocus = () => {
    if (searchText.trim() !== '' && searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleProductPress = (product: Product) => {
    console.log('🔍 Product pressed in search dropdown:', product._id, product.name_product);
    setShowSearchDropdown(false);
    setSearchText('');
    Keyboard.dismiss();
    
    // Navigate to product detail page
    console.log('🚀 Navigating to product detail:', product._id);
    router.push({
      pathname: '/products/[id]',
      params: { id: product._id }
    } as any);
  };

  const handleSeeAllPress = (searchText: string) => {
    console.log('📋 See all pressed with search:', searchText);
    setShowSearchDropdown(false);
    setSearchText('');
    Keyboard.dismiss();
    
    // Navigate to products list with search parameter
    router.push({
      pathname: '/products',
      params: { search: searchText }
    } as any);
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.fullname || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.headerWrapper}>
      {/* Welcome message */}
      <View style={styles.welcomeContainer}>
        <Ionicons name="storefront-outline" size={16} color="#333" style={styles.welcomeIcon} />
        <Text style={styles.welcomeText}>
          Chào mừng {userName ? `${userName} ` : ''}đến với hệ thống thời trang H&A
        </Text>
      </View>
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://res.cloudinary.com/dwmsfixy5/image/upload/v1749057780/logoapp_uus1zk.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Search bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearchTextChange}
              onFocus={handleSearchFocus}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchText.trim()) {
                  handleSeeAllPress(searchText);
                }
              }}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchText('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
              >
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            )}
            {isSearching && (
              <View style={styles.searchLoading}>
                <Ionicons name="refresh" size={16} color="#666" />
              </View>
            )}
          </View>
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
      
      {/* Search dropdown - outside header for better z-index */}
      {showSearch && (
        <SearchDropdown
          products={searchResults}
          onProductPress={handleProductPress}
          onSeeAllPress={handleSeeAllPress}
          searchText={searchText}
          visible={showSearchDropdown}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#fed700',
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  welcomeIcon: {
    marginRight: 6,
  },
  welcomeText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
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
    position: 'relative',
  },
  searchInput: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
    flex: 1,
    paddingVertical: 0, // Remove default padding on Android
  },
  searchLoading: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
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