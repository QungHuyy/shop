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
} from 'react-native';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import authService, { ChangePasswordData } from '../../services/authService';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const { isAuthenticated } = useAuth();
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validationSchema = Yup.object({
    currentPassword: Yup.string()
      .required('Mật khẩu hiện tại là bắt buộc'),
    newPassword: Yup.string()
      .required('Mật khẩu mới là bắt buộc'),
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
      const changePasswordData: ChangePasswordData = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };

      await authService.changePassword(changePasswordData);
      
      Alert.alert(
        'Thành công', 
        'Đổi mật khẩu thành công!',
        [
          { text: 'OK', onPress: () => {
            resetForm();
            router.back();
          }}
        ]
      );
    } catch (error: any) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
    } finally {
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Quay lại</Text>
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
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.changeButton, isSubmitting && styles.changeButtonDisabled]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.changeButtonText}>
                      {isSubmitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>

          <View style={styles.securityTips}>
            <Text style={styles.tipsTitle}>💡 Mẹo bảo mật</Text>
            <Text style={styles.tipText}>• Nên sử dụng mật khẩu có độ dài từ 6 ký tự trở lên </Text>
            <Text style={styles.tipText}>• Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</Text>
            <Text style={styles.tipText}>• Không sử dụng thông tin cá nhân dễ đoán</Text>
            <Text style={styles.tipText}>• Đổi mật khẩu định kỳ để bảo mật tài khoản</Text>
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
    backgroundColor: '#ffeaa7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 40,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 5,
  },
  changeButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#28a745',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  changeButtonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
    elevation: 0,
  },
  changeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  securityTips: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
}); 