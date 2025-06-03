import React, { useState, useEffect } from 'react';
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
import authService, { AuthResponse, UpdateProfileData } from '../../services/authService';

interface EditProfileFormValues {
  fullname: string;
  email: string;
  phone: string;
}

export default function EditProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const validationSchema = Yup.object({
    fullname: Yup.string()
      .required('Họ tên là bắt buộc')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: Yup.string()
      .email('Email không hợp lệ')
      .required('Email là bắt buộc'),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số')
      .required('Số điện thoại là bắt buộc'),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để chỉnh sửa profile', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const profile = await authService.getCurrentUser();
      setProfileData(profile);
    } catch (error) {
      console.error('Lỗi khi tải profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: EditProfileFormValues, { setSubmitting }: any) => {
    try {
      const updatedUser = await authService.updateProfile(values);
      setProfileData(updatedUser);
      
      Alert.alert(
        'Thành công', 
        'Cập nhật thông tin thành công!',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      console.error('Lỗi khi cập nhật profile:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
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
          <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profileData?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <TouchableOpacity style={styles.changeAvatarButton}>
                <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
              </TouchableOpacity>
            </View>

            <Formik
              initialValues={{
                fullname: profileData?.fullname || '',
                email: profileData?.email || '',
                phone: profileData?.phone || '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize={true}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tên đăng nhập</Text>
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      value={profileData?.username}
                      editable={false}
                    />
                    <Text style={styles.helperText}>Tên đăng nhập không thể thay đổi</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Họ tên đầy đủ</Text>
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
                    />
                    {touched.fullname && errors.fullname && (
                      <Text style={styles.errorText}>{errors.fullname}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
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
                      returnKeyType="done"
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.phone && errors.phone && styles.inputError
                      ]}
                      placeholder="Nhập số điện thoại"
                      onChangeText={handleChange('phone')}
                      onBlur={handleBlur('phone')}
                      value={values.phone}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                    />
                    {touched.phone && errors.phone && (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>

          <View style={styles.additionalOptions}>
            <TouchableOpacity style={styles.optionButton} onPress={() => router.push('/profile/change-password')}>
              <Text style={styles.optionIcon}>🔒</Text>
              <Text style={styles.optionText}>Đổi mật khẩu</Text>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>
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
    width: 50, // Để cân bằng layout
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  changeAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  changeAvatarText: {
    fontSize: 14,
    color: '#007bff',
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
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 5,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  additionalOptions: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionArrow: {
    fontSize: 16,
    color: '#666',
  },
}); 