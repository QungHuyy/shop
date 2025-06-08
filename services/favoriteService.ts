import { Product } from './productService';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../config/api';

export interface FavoriteItem {
  _id: string;
  id_user: string;
  id_product: Product;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteResponse {
  success: boolean;
  message: string;
  data?: FavoriteItem[];
}

export interface FavoriteActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CheckFavoriteResponse {
  success: boolean;
  isFavorite: boolean;
}

const favoriteService = {
  // Lấy danh sách sản phẩm yêu thích của user
  getFavorites: async (userId: string): Promise<FavoriteItem[]> => {
    try {
      console.log('🔍 Getting favorites for user:', userId);
      
      const response = await fetch(`${FAVORITE_API}/${userId}`);
      const result: FavoriteResponse = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Favorites loaded:', result.data.length);
        return result.data;
      } else {
        console.log('❌ Failed to get favorites:', result.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting favorites:', error);
      return [];
    }
  },

  // Thêm sản phẩm vào yêu thích
  addFavorite: async (userId: string, productId: string): Promise<FavoriteActionResponse> => {
    try {
      console.log('❤️ Adding favorite:', { userId, productId });
      
      const response = await fetch(`${FAVORITE_API}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_user: userId,
          id_product: productId,
        }),
      });
      
      const result: FavoriteActionResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Added to favorites:', result.message);
      } else {
        console.log('❌ Failed to add favorite:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi thêm vào yêu thích'
      };
    }
  },

  // Xóa sản phẩm khỏi yêu thích
  removeFavorite: async (userId: string, productId: string): Promise<FavoriteActionResponse> => {
    try {
      console.log('💔 Removing favorite:', { userId, productId });
      
      const response = await fetch(`${FAVORITE_API}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_user: userId,
          id_product: productId,
        }),
      });
      
      const result: FavoriteActionResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Removed from favorites:', result.message);
      } else {
        console.log('❌ Failed to remove favorite:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi xóa khỏi yêu thích'
      };
    }
  },

  // Kiểm tra sản phẩm có trong yêu thích không
  checkFavorite: async (userId: string, productId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${FAVORITE_API}/check/${userId}/${productId}`);
      const result: CheckFavoriteResponse = await response.json();
      
      if (result.success) {
        return result.isFavorite;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking favorite:', error);
      return false;
    }
  },

  // Toggle favorite (thêm/xóa)
  toggleFavorite: async (userId: string, productId: string): Promise<{ success: boolean, isFavorite: boolean, message: string }> => {
    try {
      // Kiểm tra trạng thái hiện tại
      const isFavorite = await favoriteService.checkFavorite(userId, productId);
      
      let result: FavoriteActionResponse;
      
      if (isFavorite) {
        // Nếu đã yêu thích thì xóa
        result = await favoriteService.removeFavorite(userId, productId);
        return {
          success: result.success,
          isFavorite: false,
          message: result.message
        };
      } else {
        // Nếu chưa yêu thích thì thêm
        result = await favoriteService.addFavorite(userId, productId);
        return {
          success: result.success,
          isFavorite: true,
          message: result.message
        };
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      return {
        success: false,
        isFavorite: false,
        message: 'Lỗi khi thay đổi trạng thái yêu thích'
      };
    }
  }
};

// Export individual functions
export const getFavorites = favoriteService.getFavorites;
export const addFavorite = favoriteService.addFavorite;
export const removeFavorite = favoriteService.removeFavorite;
export const checkFavorite = favoriteService.checkFavorite;
export const toggleFavorite = favoriteService.toggleFavorite;

export default favoriteService; 