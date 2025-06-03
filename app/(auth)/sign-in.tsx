import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface SignInFormValues {
  username: string;
  password: string;
}

export default function SignIn() {
  const { signIn } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [error, setError] = useState<string>('');

  const validationSchema = Yup.object({
    username: Yup.string()
      .required('Tên đăng nhập là bắt buộc'),
    password: Yup.string()
      .required('Mật khẩu là bắt buộc'),
  });

  const handleSubmit = async (values: SignInFormValues, { setSubmitting }: any) => {
    try {
      setError('');
      console.log('Đang gửi yêu cầu đăng nhập với:', values);
      
      await signIn(values.username, values.password);
      showSuccess('Đăng nhập thành công! Chào mừng bạn đến với ứng dụng.');
      
      // Navigation sẽ được xử lý tự động bởi _layout.tsx dựa trên isAuthenticated
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      const message = err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
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
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>Chào mừng bạn quay trở lại!</Text>
          </View>

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Tên đăng nhập</Text>
                  <TextInput
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
                    blurOnSubmit={false}
                  />
                  {touched.username && errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.password && errors.password && styles.inputError
                    ]}
                    placeholder="Nhập mật khẩu"
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={() => handleSubmit()}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.push('/sign-up')}
                >
                  <Text style={styles.linkText}>
                    Chưa có tài khoản? <Text style={styles.linkTextBold}>Đăng ký ngay</Text>
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
    justifyContent: 'center',
    minHeight: Platform.OS === 'ios' ? '100%' : 'auto',
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
    marginBottom: 20,
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
    marginTop: 10,
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