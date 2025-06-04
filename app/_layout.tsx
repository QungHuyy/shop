import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FloatingCartIcon from '../components/FloatingCartIcon';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/sign-in" />
              <Stack.Screen name="(auth)/sign-up" />
              <Stack.Screen name="profile/view" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="profile/change-password" />
              <Stack.Screen name="cart/index" />
            </Stack>
            <FloatingCartIcon />
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
