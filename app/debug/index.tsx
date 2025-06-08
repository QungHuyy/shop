import React, { useState } from 'react';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../../config/api';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetworkHelper from '@/utils/networkHelper';

export default function DebugScreen() {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Chưa kiểm tra');
  const [lastTestResult, setLastTestResult] = useState<string>('');

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus('Đang kiểm tra...');
    
    try {
      const testUrls = [
        API_BASE_URL,
        'http://192.168.0.100:8000', 
        'http://10.0.0.100:8000',
        'http://localhost:8000'
      ];

      let successCount = 0;
      let results = [];

      for (const url of testUrls) {
        const result = await NetworkHelper.testServerConnection(url);
        results.push(`${url}: ${result.success ? '✅' : '❌'} ${result.message}`);
        if (result.success) successCount++;
      }

      if (successCount > 0) {
        setConnectionStatus('✅ Kết nối thành công!');
      } else {
        setConnectionStatus('❌ Không thể kết nối');
      }

      setLastTestResult(results.join('\n\n'));
      
    } catch (error) {
      setConnectionStatus('❌ Lỗi kiểm tra');
      setLastTestResult(`Error: ${error}`);
    }
    
    setTesting(false);
  };

  const showInstructions = () => {
    Alert.alert(
      'Hướng dẫn setup',
      NetworkHelper.getSetupInstructions(),
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fed700" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debug Connection</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Kiểm tra kết nối Backend</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Trạng thái:</Text>
            <Text style={styles.statusText}>{connectionStatus}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, testing && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="wifi" size={20} color="white" />
            )}
            <Text style={styles.buttonText}>
              {testing ? 'Đang kiểm tra...' : 'Test kết nối'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={showInstructions}
          >
            <Ionicons name="help-circle" size={20} color="#fed700" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Hướng dẫn setup
            </Text>
          </TouchableOpacity>
        </View>

        {lastTestResult ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Kết quả test</Text>
            <View style={styles.resultCard}>
              <ScrollView style={styles.resultScroll}>
                <Text style={styles.resultText}>{lastTestResult}</Text>
              </ScrollView>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Các bước thường gặp</Text>
          <View style={styles.stepCard}>
            <Text style={styles.stepText}>1️⃣ Khởi chạy backend server (port 8000)</Text>
            <Text style={styles.stepText}>2️⃣ Tìm IP máy tính: cmd → ipconfig</Text>
            <Text style={styles.stepText}>3️⃣ Cập nhật IP trong productService.ts</Text>
            <Text style={styles.stepText}>4️⃣ Cùng mạng WiFi với điện thoại</Text>
            <Text style={styles.stepText}>5️⃣ Test trên browser trước</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 URLs thường dùng</Text>
          <View style={styles.urlCard}>
            <Text style={styles.urlText}>• {PRODUCT_API}</Text>
            <Text style={styles.urlText}>• http://192.168.0.100:8000/api/Product</Text>
            <Text style={styles.urlText}>• http://10.0.0.100:8000/api/Product</Text>
            <Text style={styles.urlText}>• http://localhost:8000/api/Product</Text>
          </View>
        </View>
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
    backgroundColor: '#fed700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    backgroundColor: '#fed700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#fed700',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonTextSecondary: {
    color: '#fed700',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultScroll: {
    flex: 1,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  stepCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  urlCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
}); 