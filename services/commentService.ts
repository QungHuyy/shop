import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL API
const API_BASE_URL = 'http://192.168.1.45:8000';

export interface Comment {
  _id: string;
  id_product: string;
  id_user: {
    _id: string;
    fullname: string;
    email?: string;
  };
  content: string;
  star: number;
  created_at: string;
}

export interface CreateCommentData {
  id_user: string;
  content: string;
  star: number;
}

export interface ReviewCheckResponse {
  canReview: boolean;
  message: string;
}

const commentService = {
  // Lấy danh sách comment cho sản phẩm
  getComments: async (productId: string): Promise<Comment[]> => {
    try {
      console.log(`🔍 Loading comments for product: ${productId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/Comment/${productId}`);
      const comments = await response.json();
      
      console.log('✅ Comments loaded:', comments.length);
      return comments || [];
    } catch (error) {
      console.error('❌ Error loading comments:', error);
      return [];
    }
  },

  // Kiểm tra quyền đánh giá sản phẩm
  checkCanReview: async (productId: string, userId: string): Promise<ReviewCheckResponse> => {
    try {
      console.log(`🔍 Checking review permission for user: ${userId}, product: ${productId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/Comment/check/${productId}/${userId}`);
      const result = await response.json();
      
      console.log('✅ Review check result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error checking review permission:', error);
      return {
        canReview: false,
        message: 'Không thể kiểm tra quyền đánh giá'
      };
    }
  },

  // Gửi đánh giá mới
  createComment: async (productId: string, commentData: CreateCommentData): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(`📝 Submitting comment for product: ${productId}`, commentData);
      
      const response = await fetch(`${API_BASE_URL}/api/Comment/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      const result = await response.json();
      console.log('✅ Comment submission result:', result);
      
      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message || 'Đánh giá đã được gửi thành công!'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Không thể gửi đánh giá'
        };
      }
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi gửi đánh giá'
      };
    }
  },

  // Tính toán rating trung bình
  calculateAverageRating: (comments: Comment[]): string => {
    if (comments.length === 0) return '0.0';
    const total = comments.reduce((sum, comment) => sum + comment.star, 0);
    return (total / comments.length).toFixed(1);
  },

  // Format thời gian hiển thị
  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
};

export default commentService; 