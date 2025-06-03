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

interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp = () => {
  const navigation = useNavigation();
  const [error, setError] = useState<string>('');

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required('Họ tên là bắt buộc')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: Yup.string()
      .email('Email không hợp lệ')
      .required('Email là bắt buộc'),
    password: Yup.string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .required('Mật khẩu là bắt buộc'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Mật khẩu không khớp')
      .required('Xác nhận mật khẩu là bắt buộc'),
  });

  const handleSubmit = async (values: SignUpFormValues) => {
    try {
      const { confirmPassword, ...signUpData } = values;
      await authService.signUp(signUpData);
      navigation.navigate('SignIn');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      Alert.alert('Lỗi', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng ký</Text>

        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Họ tên"
                  onChangeText={handleChange('fullName')}
                  onBlur={handleBlur('fullName')}
                  value={values.fullName}
                />
                {touched.fullName && errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

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

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  value={values.confirmPassword}
                  secureTextEntry
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSubmit()}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('SignIn')}
              >
                <Text style={styles.linkText}>
                  Đã có tài khoản? Đăng nhập
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

export default SignUp; 