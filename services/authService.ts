import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_API, API_URL } from '../config/api'; // Import centralized API config

// Cấu hình axios
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface SignUpData {
  fullname: string;
  username: string;
  password: string;
  email?: string;
  phone: string;
}

export interface SignInData {
  username: string;
  password: string;
}

export interface AuthResponse {
  _id: string;
  fullname: string;
  username: string;
  email?: string;
  phone?: string;
}

export interface UpdateProfileData {
  fullname: string;
  email: string;
  phone: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const authService = {
  // Verify user data từ server
  verifyUserById: async (userId: string): Promise<any> => {
    try {
      console.log('🔍 Verifying user by ID:', userId);
      
      const response = await fetch(`${USER_API}/${userId}`);
      console.log('📡 Verify response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('👤 User data from server:', userData);
        return userData;
      } else {
        console.log('❌ Failed to get user data');
        return null;
      }
    } catch (error: any) {
      console.error('❌ Verify user failed:', error);
      return null;
    }
  },

  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    try {
      console.log('Gửi yêu cầu đăng ký với dữ liệu:', data);
      console.log('URL đăng ký:', API_URL);
      
      // Thêm các trường mặc định với ID permission cố định
      const signUpData = {
        ...data,
        gender: '', // Có thể thêm trường gender vào form nếu cần
        id_permission: "6087dcb5f269113b3460fce4" // ID permission mặc định cho user
      };
      
      console.log('Dữ liệu gửi lên server:', signUpData);
      const response = await axios.post(API_URL, signUpData);
      console.log('Phản hồi từ server khi đăng ký:', response.data);

      if (response.data === "User Da Ton Tai") {
        throw new Error('Tên đăng nhập đã tồn tại');
      }
      if (response.data === "Email Da Ton Tai") {
        throw new Error('Email đã được sử dụng');
      }
      if (response.data === "Phone Da Ton Tai") {
        throw new Error('Số điện thoại đã được sử dụng');
      }
      if (response.data === "Thanh Cong") {
        // Tự động đăng nhập sau khi đăng ký
        console.log('Đăng ký thành công, thử đăng nhập...');
        return await authService.signIn({
          username: data.username,
          password: data.password
        });
      }
      throw new Error('Đăng ký thất bại');
    } catch (error: any) {
      console.error('Lỗi khi đăng ký:', error);
      console.error('Chi tiết lỗi:', error.response?.data);
      throw new Error(error.message || 'Đăng ký thất bại');
    }
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    try {
      console.log('Gọi API đăng nhập với:', data);
      console.log('URL API:', `${API_URL}/detail/login`);
      
      const response = await axios.get(`${API_URL}/detail/login`, {
        params: {
          username: data.username,
          password: data.password
        }
      });

      console.log('Response từ server:', response);
      console.log('Response data:', response.data);

      // Kiểm tra response.data có phải là string không
      if (typeof response.data === 'string') {
        console.log('Response là string:', response.data);
        if (response.data === "Khong Tìm Thấy User") {
          throw new Error('Tài khoản không tồn tại');
        }
        if (response.data === "Sai Mat Khau") {
          throw new Error('Sai mật khẩu');
        }
        throw new Error('Đăng nhập thất bại');
      }

      console.log('Response là object, lưu vào AsyncStorage');
      // Nếu response.data là object (thông tin user), lưu vào AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.error('Lỗi trong quá trình đăng nhập:', error);
      console.error('Error response:', error.response);
      if (error.response) {
        // Lỗi từ server
        console.error('Server error:', error.response.data);
        throw new Error(error.response.data || 'Đăng nhập thất bại');
      }
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      console.log('User logged out successfully, all data cleared from AsyncStorage');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  },

  getCurrentUser: async (): Promise<AuthResponse | null> => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) return JSON.parse(userStr);
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      return null;
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Lỗi khi lấy token:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const user = await authService.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Lỗi khi kiểm tra xác thực:', error);
      return false;
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<AuthResponse> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Chưa đăng nhập');
      }

      const updateData = {
        _id: currentUser._id,
        fullname: data.fullname,
        username: currentUser.username, // Giữ nguyên username
        email: data.email,
        phone: data.phone,
        gender: '', // Có thể bỏ trống hoặc giữ giá trị cũ
        // Sử dụng permission hiện tại thay vì ID cứng
        // id_permission: "6087dcb5f269113b3460fce4",
      };

      console.log('🔄 Updating profile with data:', updateData);
      console.log('🌐 API URL:', USER_API);
      console.log('📝 Current user email/phone:', { email: currentUser.email, phone: currentUser.phone });
      console.log('📝 New email/phone:', { email: data.email, phone: data.phone });

      const response = await fetch(USER_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers));
      
      // Check if response is not ok
      if (!response.ok) {
        console.log('❌ Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response text:', `"${errorText}"`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.text();
      console.log('📨 Raw server response:', `"${result}"`);
      console.log('📨 Response length:', result.length);
      console.log('📨 Response char codes:', result.split('').map(c => c.charCodeAt(0)));

      // Trim whitespace từ response
      const trimmedResult = result.trim();
      console.log('🧹 Trimmed response:', `"${trimmedResult}"`);
      console.log('🧹 Trimmed length:', trimmedResult.length);

      // Check each condition với explicit logging
      console.log('🔍 Checking conditions:');
      console.log('🔍 trimmedResult === "Thanh Cong":', trimmedResult === "Thanh Cong");
      console.log('🔍 response.status === 200:', response.status === 200);
      console.log('🔍 trimmedResult === "Email Da Ton Tai":', trimmedResult === "Email Da Ton Tai");
      console.log('🔍 trimmedResult === "Phone Da Ton Tai":', trimmedResult === "Phone Da Ton Tai");

      // Check for error cases FIRST
      if (trimmedResult === "Email Da Ton Tai") {
        console.log('❌ Email duplicate detected - throwing error');
        throw new Error('Email đã được sử dụng');
      } else if (trimmedResult === "Phone Da Ton Tai") {
        console.log('❌ Phone duplicate detected - throwing error');
        throw new Error('Số điện thoại đã được sử dụng');
      } else if (trimmedResult === "Khong Co Thay Doi") {
        console.log('⚠️ No changes detected - throwing error');
        throw new Error('Không có thay đổi nào để cập nhật');
      } else if (trimmedResult === "Thanh Cong") {
        console.log('✅ Update successful condition met');
        // Update local storage with new user info
        const updatedUser = {
          ...currentUser,
          ...data
        };
        console.log('💾 Saving updated user to AsyncStorage:', updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        console.log('❌ Unexpected response - throwing error');
        throw new Error(`Cập nhật thất bại: ${trimmedResult}`);
      }
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error stack:', error.stack);
      
      // Re-throw the error as-is để preserve error message
      if (error.message === 'Email đã được sử dụng' || 
          error.message === 'Số điện thoại đã được sử dụng') {
        console.log('🔄 Re-throwing validation error');
        throw error;
      }
      
      console.log('🔄 Throwing generic error');
      throw new Error(error.message || 'Cập nhật profile thất bại');
    }
  },

  changePassword: async (data: ChangePasswordData): Promise<boolean> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Chưa đăng nhập');
      }

      console.log('Changing password for user:', currentUser._id);
  
      const response = await fetch(USER_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: currentUser._id,
          username: currentUser.username,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.text();
      console.log('Change password response:', result);

      if (result === "Thanh Cong" || response.status === 200) {
        console.log('Password changed successfully');
        return true;
      } else if (result === "Email Da Ton Tai") {
        throw new Error('Email đã được sử dụng');
      } else if (result === "Phone Da Ton Tai") {
        throw new Error('Số điện thoại đã được sử dụng');
      } else {
        throw new Error('Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw new Error(error.message || 'Đổi mật khẩu thất bại');
    }
  },
};

export default authService; 