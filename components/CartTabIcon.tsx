import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';

interface CartTabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export default function CartTabIcon({ focused, color, size }: CartTabIconProps) {
  const { cartSummary } = useCart();

  return (
    <View style={styles.container}>
      <Ionicons 
        name={focused ? 'cart' : 'cart-outline'} 
        size={size} 
        color={color} 
      />
      {cartSummary.totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cartSummary.totalItems > 99 ? '99+' : cartSummary.totalItems}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#fe0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
}); 