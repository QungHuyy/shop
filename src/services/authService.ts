import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth'; // Thay đổi URL API theo backend của bạn

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

const authService = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/signup`, data);
    return response.data;
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/signin`, data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signOut: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): any => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default authService; 