import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';

interface SignInFormValues {
  email: string;
  password: string;
}

const SignIn = () => {
  const navigation = useNavigation();
  const [error, setError] = useState<string>('');

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Email không hợp lệ')
      .required('Email là bắt buộc'),
    password: Yup.string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .required('Mật khẩu là bắt buộc'),
  });

  const handleSubmit = async (values: SignInFormValues) => {
    try {
      await authService.signIn(values);
      // Navigation will be handled by App.tsx based on authentication state
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      Alert.alert('Lỗi', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng nhập</Text>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  secureTextEntry
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSubmit()}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.linkText}>
                  Chưa có tài khoản? Đăng ký ngay
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: '#1976d2',
    textAlign: 'center',
  },
});

export default SignIn; 