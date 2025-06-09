import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import authService, { ChangePasswordData } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../../contexts/NotificationContext';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validationSchema = Yup.object({
    currentPassword: Yup.string()
      .required('Mật khẩu hiện tại là bắt buộc'),
    newPassword: Yup.string()
      .required('Mật khẩu mới là bắt buộc')
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Xác nhận mật khẩu không khớp')
      .required('Xác nhận mật khẩu là bắt buộc'),
  });

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để đổi mật khẩu', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (values: ChangePasswordFormValues, { setSubmitting, resetForm }: any) => {
    try {
      setLoading(true);
      
      // Hiển thị trạng thái đang xử lý
      showSuccess('Đang xử lý...');
      
      const changePasswordData: ChangePasswordData = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };

      await authService.changePassword(changePasswordData);
      
      // Hiển thị thông báo thành công rõ ràng hơn
      Alert.alert(
        'Thành công',
        'Mật khẩu của bạn đã được cập nhật thành công!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              resetForm();
              router.back();
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      
      // Hiển thị thông báo lỗi chi tiết bằng Alert
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formCard}>
            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <Text style={styles.iconText}>🔒</Text>
              </View>
              <Text style={styles.description}>
                Vì bảo mật, bạn cần nhập mật khẩu hiện tại để xác nhận danh tính
              </Text>
            </View>

            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mật khẩu hiện tại</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.currentPassword && errors.currentPassword && styles.inputError
                      ]}
                      placeholder="Nhập mật khẩu hiện tại"
                      onChangeText={handleChange('currentPassword')}
                      onBlur={handleBlur('currentPassword')}
                      value={values.currentPassword}
                      secureTextEntry
                      returnKeyType="next"
                      onSubmitEditing={() => newPasswordRef.current?.focus()}
                      blurOnSubmit={false}
                      editable={!loading}
                    />
                    {touched.currentPassword && errors.currentPassword && (
                      <Text style={styles.errorText}>{errors.currentPassword}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mật khẩu mới</Text>
                    <TextInput
                      ref={newPasswordRef}
                      style={[
                        styles.input,
                        touched.newPassword && errors.newPassword && styles.inputError
                      ]}
                      placeholder="Nhập mật khẩu mới"
                      onChangeText={handleChange('newPassword')}
                      onBlur={handleBlur('newPassword')}
                      value={values.newPassword}
                      secureTextEntry
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      blurOnSubmit={false}
                      editable={!loading}
                    />
                    {touched.newPassword && errors.newPassword && (
                      <Text style={styles.errorText}>{errors.newPassword}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[
                        styles.input,
                        touched.confirmPassword && errors.confirmPassword && styles.inputError
                      ]}
                      placeholder="Nhập lại mật khẩu mới"
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      value={values.confirmPassword}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={() => handleSubmit()}
                      editable={!loading}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.changeButton, (isSubmitting || loading) && styles.changeButtonDisabled]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting || loading}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.changeButtonText}>Đang xử lý...</Text>
                      </View>
                    ) : (
                      <Text style={styles.changeButtonText}>Đổi mật khẩu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 32,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  form: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  changeButton: {
    backgroundColor: '#fed700',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  changeButtonDisabled: {
    opacity: 0.7,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 