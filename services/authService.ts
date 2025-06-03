import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thay đổi IP này thành địa chỉ IP của máy chủ backend của bạn
const API_URL = 'http://192.168.1.45:8000/api/User';

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
      console.log('Cập nhật profile với dữ liệu:', data);
      
      // Lấy thông tin user hiện tại để có _id
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      const updateData = {
        _id: currentUser._id,
        username: currentUser.username,
        fullname: data.fullname,
        email: data.email,
        phone: data.phone,
        gender: '', // Giữ gender cũ hoặc mặc định
        id_permission: "6087dcb5f269113b3460fce4" // Giữ permission cũ
      };
      
      console.log('Dữ liệu gửi lên server để cập nhật:', updateData);
      const response = await axios.put(API_URL, updateData);
      console.log('Phản hồi từ server khi cập nhật:', response.data);

      if (response.data === "Email Da Ton Tai") {
        throw new Error('Email đã được sử dụng bởi tài khoản khác');
      }
      if (response.data === "Phone Da Ton Tai") {
        throw new Error('Số điện thoại đã được sử dụng bởi tài khoản khác');
      }
      if (response.data === "Khong Tim Thay User") {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      if (response.data === "Thanh Cong") {
        // Lấy lại thông tin user sau khi cập nhật
        const updatedUser = { 
          ...currentUser, 
          fullname: data.fullname,
          email: data.email,
          phone: data.phone
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error('Cập nhật thông tin thất bại');
    } catch (error: any) {
      console.error('Lỗi khi cập nhật profile:', error);
      console.error('Chi tiết lỗi:', error.response?.data);
      throw new Error(error.message || 'Cập nhật thông tin thất bại');
    }
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    try {
      console.log('Đổi mật khẩu');
      
      // Lấy thông tin user hiện tại
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      // Kiểm tra mật khẩu hiện tại trước
      try {
        await authService.signIn({
          username: currentUser.username,
          password: data.currentPassword
        });
      } catch (error) {
        throw new Error('Mật khẩu hiện tại không đúng');
      }
      
      // Cập nhật mật khẩu mới
      const updateData = {
        _id: currentUser._id,
        username: currentUser.username,
        fullname: currentUser.fullname,
        email: currentUser.email,
        phone: currentUser.phone,
        password: data.newPassword,
        gender: '', 
        id_permission: "6087dcb5f269113b3460fce4"
      };
      
      console.log('Cập nhật mật khẩu mới');
      const response = await axios.put(API_URL, updateData);
      console.log('Phản hồi từ server khi đổi mật khẩu:', response.data);

      if (response.data !== "Thanh Cong") {
        throw new Error('Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      console.error('Chi tiết lỗi:', error.response?.data);
      throw new Error(error.message || 'Đổi mật khẩu thất bại');
    }
  },
};

export default authService; 