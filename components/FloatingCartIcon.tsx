import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { useRouter, usePathname } from 'expo-router';

const FloatingCartIcon = () => {
  const { cartSummary } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Define pages where cart icon should NOT be shown
  const hiddenRoutes = [
    '/(auth)/sign-in',
    '/(auth)/sign-up',
    '/profile/view',
    '/profile/edit',
    '/profile/change-password',
    '/cart',
    '/cart/',
    '/cart/index',
    '/(tabs)/account',
    '/account',
  ];

  // Define route patterns that should hide the icon
  const hiddenPatterns = [
    '/profile',
    '/cart',
    '/(auth)',
    '/(tabs)/account',
    '/account',
  ];

  // Check if current route should hide the cart icon
  const shouldHideIcon = 
    hiddenRoutes.includes(pathname) ||
    hiddenPatterns.some(pattern => pathname.startsWith(pattern)) ||
    pathname === '/(tabs)/account' ||
    pathname === '/account';

  // Animate when cart items change
  useEffect(() => {
    if (cartSummary.totalItems > 0) {
      // Bounce animation when items are added
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cartSummary.totalItems]);

  // Don't render if on hidden routes
  if (shouldHideIcon) {
    return null;
  }

  const handlePress = () => {
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    router.push('../../cart/');
  };

  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: bounceTransform }
          ],
        },
      ]}
    >
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="bag" size={24} color="#333" />
          {cartSummary.totalItems > 0 && (
            <Animated.View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
              </Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Above tab bar if exists
    right: 20,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fed700',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fe0000',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  touchable: {
    flex: 1,
  },
});

export default React.memo(FloatingCartIcon); 