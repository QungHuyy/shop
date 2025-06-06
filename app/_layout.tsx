import React from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, Alert } from 'react-native';

// Hàm kiểm tra xem route có cần bảo vệ không
const isProtectedRoute = (pathname: string): boolean => {
  const protectedRoutes = [
    '/cart',
    '/checkout',
    '/profile',
    '/order-detail',
    '/orders',
  ];
  return protectedRoutes.some(route => pathname.startsWith(route));
};

// Middleware để kiểm tra đăng nhập
function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const needsAuth = isProtectedRoute(pathname);

  // Không tự động chuyển hướng nữa, chỉ hiển thị thông báo khi cần
  // và cho phép người dùng tiếp tục sử dụng app

  // Nếu đang loading, hiển thị màn hình loading
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fed700" />
        <Text style={{ marginTop: 10 }}>Đang tải...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <AuthMiddleware>
              <Stack
                initialRouteName="(tabs)"
                screenOptions={{
                  headerShown: false,
                  // Cấu hình để tránh lỗi GO_BACK
                  gestureEnabled: true,
                  animationTypeForReplace: 'push',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="(auth)/sign-in" 
                  options={{ 
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }} 
                />
                <Stack.Screen 
                  name="(auth)/sign-up" 
                  options={{ 
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }} 
                />
                <Stack.Screen name="profile/view" />
                <Stack.Screen name="profile/edit" />
                <Stack.Screen name="profile/change-password" />
                <Stack.Screen name="cart/index" />
                <Stack.Screen name="checkout/index" />
                <Stack.Screen name="notifications/index" />
                <Stack.Screen name="order-detail/[id]" />
                <Stack.Screen name="order-success/index" />
              </Stack>
            </AuthMiddleware>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
