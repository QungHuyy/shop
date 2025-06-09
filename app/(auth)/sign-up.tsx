import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';
import { useNotification } from '../../contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';

interface SignUpFormValues {
  fullname: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
}

export default function SignUp() {
  const { showSuccess, showError } = useNotification();
  const [error, setError] = useState<string>('');
  
  // Refs cho việc chuyển focus giữa các TextInput
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validationSchema = Yup.object({
    fullname: Yup.string()
      .required('Họ tên là bắt buộc')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    username: Yup.string()
      .required('Tên đăng nhập là bắt buộc')
      .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
    email: Yup.string()
      .email('Email không hợp lệ')
      .required('Email là bắt buộc'),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số')
      .required('Số điện thoại là bắt buộc'),
    password: Yup.string()
      .required('Mật khẩu là bắt buộc'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Mật khẩu không khớp')
      .required('Xác nhận mật khẩu là bắt buộc'),
  });

  const handleSubmit = async (values: SignUpFormValues, { setSubmitting }: any) => {
    try {
      setError('');
      const { confirmPassword, ...signUpData } = values;
      
      // Hiển thị loading trạng thái đăng ký
      showSuccess('Đang đăng ký tài khoản...');
      
      const response = await authService.signUp(signUpData);
      
      if (response) {
        // Hiển thị thông báo thành công rõ ràng hơn
        showSuccess('Đăng ký thành công! Chào mừng bạn đến với ứng dụng.');
        
        // Đảm bảo thông báo hiển thị đủ lâu trước khi chuyển trang
        setTimeout(() => {
          // Chuyển đến trang chủ sau khi đăng ký thành công
          router.replace('/(tabs)');
        }, 2000);
      }
    } catch (err: any) {
      const message = err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm xử lý nút back an toàn
  const handleBackPress = () => {
    try {
      // Kiểm tra xem có thể quay lại không
      if (router.canGoBack()) {
        router.back();
      } else {
        // Nếu không thể quay lại, chuyển về trang chính
        router.replace('/');
      }
    } catch (error) {
      console.log('Navigation error:', error);
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu mua sắm</Text>
          </View>

          <Formik
            initialValues={{
              fullname: '',
              username: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Họ tên</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.fullname && errors.fullname && styles.inputError
                    ]}
                    placeholder="Nhập họ tên đầy đủ"
                    onChangeText={handleChange('fullname')}
                    onBlur={handleBlur('fullname')}
                    value={values.fullname}
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {touched.fullname && errors.fullname && (
                    <Text style={styles.errorText}>{errors.fullname}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Tên đăng nhập</Text>
                  <TextInput
                    ref={usernameRef}
                    style={[
                      styles.input,
                      touched.username && errors.username && styles.inputError
                    ]}
                    placeholder="Nhập tên đăng nhập"
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    value={values.username}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {touched.username && errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    ref={emailRef}
                    style={[
                      styles.input,
                      touched.email && errors.email && styles.inputError
                    ]}
                    placeholder="Nhập địa chỉ email"
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    value={values.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput
                    ref={phoneRef}
                    style={[
                      styles.input,
                      touched.phone && errors.phone && styles.inputError
                    ]}
                    placeholder="Nhập số điện thoại"
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    value={values.phone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <TextInput
                    ref={passwordRef}
                    style={[
                      styles.input,
                      touched.password && errors.password && styles.inputError
                    ]}
                    placeholder="Nhập mật khẩu"
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                    secureTextEntry
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Xác nhận mật khẩu</Text>
                  <TextInput
                    ref={confirmPasswordRef}
                    style={[
                      styles.input,
                      touched.confirmPassword && errors.confirmPassword && styles.inputError
                    ]}
                    placeholder="Nhập lại mật khẩu"
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
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.push('/sign-in')}
                >
                  <Text style={styles.linkText}>
                    Đã có tài khoản? <Text style={styles.linkTextBold}>Đăng nhập</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
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
  button: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#007bff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#007bff',
    fontWeight: 'bold',
  },
}); 