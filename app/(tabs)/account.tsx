import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface User {
  _id?: string;
  fullname?: string;
  email?: string;
  phone?: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Thông tin cá nhân',
      subtitle: 'Quản lý thông tin tài khoản',
      action: () => router.push('/profile/view'),
    },
    {
      icon: 'create-outline', 
      title: 'Chỉnh sửa hồ sơ',
      subtitle: 'Cập nhật thông tin cá nhân',
      action: () => router.push('/profile/edit'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Đổi mật khẩu',
      subtitle: 'Thay đổi mật khẩu đăng nhập',
      action: () => router.push('/profile/change-password'),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Tư vấn viên AI',
      subtitle: 'Hỗ trợ tìm kiếm và tư vấn sản phẩm',
      action: () => router.push('/chatbot' as any),
    },
    {
      icon: 'help-circle-outline',
      title: 'Hỗ trợ',
      subtitle: 'Liên hệ với chúng tôi',
      action: () => Alert.alert('Hỗ trợ', 'Tính năng đang được phát triển'),
    },
    {
      icon: 'information-circle-outline',
      title: 'Về ứng dụng',
      subtitle: 'Thông tin phiên bản',
      action: () => Alert.alert('Về ứng dụng', 'Phiên bản 1.0.0'),
    },
  ];

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra đăng nhập:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              setUser(null);
              Alert.alert('Thành công', 'Đã đăng xuất thành công!');
            } catch (error) {
              console.error('Lỗi khi đăng xuất:', error);
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#666" />
          </View>
          
          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.fullname || 'Người dùng'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Chưa đăng nhập</Text>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color="#666" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        {user && (
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ff4757" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
   
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  loginPrompt: {
    flex: 1,
  },
  loginText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  logoutSection: {
    backgroundColor: 'white',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff4757',
    marginLeft: 8,
  },
}); 