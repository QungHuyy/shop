import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CART_API, API_URL } from '../config/api'; // Import centralized API config

export interface CartItem {
  id_cart: string;
  id_product: string;
  name_product: string;
  price_product: number;
  count: number;
  image: string;
  size: string;
  originalPrice?: number; // For sale items
}

export interface CartSummary {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

// Key lưu trữ giỏ hàng cho người dùng chưa đăng nhập
const CART_STORAGE_KEY = 'cart_items';
// Key lưu trữ ID người dùng hiện tại
const CURRENT_USER_ID_KEY = 'current_user_id';

const cartService = {
  // Lưu ID người dùng hiện tại
  setCurrentUserId: async (userId: string | null): Promise<void> => {
    if (userId) {
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  },

  // Lấy ID người dùng hiện tại
  getCurrentUserId: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
  },

  // Lấy tất cả sản phẩm trong giỏ hàng
  getCartItems: async (): Promise<CartItem[]> => {
    try {
      const userId = await cartService.getCurrentUserId();
      
      // Nếu đã đăng nhập, lấy giỏ hàng từ server
      if (userId) {
        try {
          console.log('🔍 Fetching cart from server for user:', userId);
          const response = await axios.get(`${API_URL}/Cart/user/${userId}`);
          
          if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Fetched ${response.data.length} items from server cart`);
            
            // Chuyển đổi dữ liệu từ server về định dạng CartItem
            const cartItems: CartItem[] = response.data.map((item: any) => ({
              id_cart: item._id || item.id_cart,
              id_product: item.id_product,
              name_product: item.name_product,
              price_product: item.price_product,
              count: item.count,
              image: item.image,
              size: item.size,
              originalPrice: item.originalPrice
            }));
            
            return cartItems;
          }
          return [];
        } catch (error) {
          console.error('❌ Error fetching cart from server:', error);
          // Fallback to local storage if server request fails
          const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
          return cartData ? JSON.parse(cartData) : [];
        }
      } 
      
      // Nếu chưa đăng nhập, lấy giỏ hàng từ local storage
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('❌ Error getting cart items:', error);
      return [];
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  addProduct: async (data: Omit<CartItem, 'id_cart'>): Promise<boolean> => {
    try {
      const userId = await cartService.getCurrentUserId();
      
      // Nếu đã đăng nhập, thêm vào giỏ hàng trên server
      if (userId) {
        try {
          console.log('🛒 Adding product to server cart for user:', userId);
          
          // Chuẩn bị dữ liệu để gửi lên server
          const cartData = {
            id_user: userId,
            id_product: data.id_product,
            name_product: data.name_product,
            price_product: data.price_product,
            count: data.count,
            image: data.image,
            size: data.size,
            originalPrice: data.originalPrice
          };
          
          // Gọi API thêm vào giỏ hàng
          const response = await axios.post(`${API_URL}/Cart`, cartData);
          console.log('✅ Added item to server cart:', response.data);
          return true;
        } catch (error) {
          console.error('❌ Error adding product to server cart:', error);
          // Fallback to local storage if server request fails
        }
      }
      
      // Xử lý giỏ hàng local nếu chưa đăng nhập hoặc server request fails
      const existingCart = await cartService.getCartItems();
      
      // Tạo ID giỏ hàng mới
      const newItemId = Math.random().toString();
      const newItem: CartItem = {
        ...data,
        id_cart: newItemId
      };

      console.log('🛒 Adding product to local cart');

      // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
      let found = false;
      const updatedCart = existingCart.map(item => {
        if (item.id_product === newItem.id_product && item.size === newItem.size) {
          found = true;
          return {
            ...item,
            count: item.count + newItem.count
          };
        }
        return item;
      });

      if (!found) {
        // Add as new item
        updatedCart.push(newItem);
        console.log('✅ Added new item to local cart');
      } else {
        console.log('✅ Updated existing item quantity in local cart');
      }

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      return true;
    } catch (error) {
      console.error('❌ Error adding product to cart:', error);
      return false;
    }
  },

  // Cập nhật số lượng sản phẩm
  updateQuantity: async (id_cart: string, newCount: number): Promise<boolean> => {
    try {
      const userId = await cartService.getCurrentUserId();
      
      // Nếu đã đăng nhập, cập nhật trên server
      if (userId) {
        try {
          console.log('🔄 Updating cart item quantity on server:', id_cart);
          await axios.put(`${API_URL}/Cart/${id_cart}`, {
            count: newCount
          });
          console.log('✅ Updated cart item quantity on server');
          return true;
        } catch (error) {
          console.error('❌ Error updating cart quantity on server:', error);
          // Fallback to local storage if server request fails
        }
      }
      
      // Cập nhật trong local storage
      const existingCart = await cartService.getCartItems();
      const updatedCart = existingCart.map(item => {
        if (item.id_cart === id_cart) {
          return { ...item, count: newCount };
        }
        return item;
      });

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      console.log('✅ Updated cart item quantity in local storage');
      return true;
    } catch (error) {
      console.error('❌ Error updating cart quantity:', error);
      return false;
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  removeItem: async (id_cart: string): Promise<boolean> => {
    try {
      const userId = await cartService.getCurrentUserId();
      
      // Nếu đã đăng nhập, xóa trên server
      if (userId) {
        try {
          console.log('🗑️ Removing item from server cart:', id_cart);
          await axios.delete(`${API_URL}/Cart/${id_cart}`);
          console.log('✅ Removed item from server cart');
          return true;
        } catch (error) {
          console.error('❌ Error removing cart item from server:', error);
          // Fallback to local storage if server request fails
        }
      }
      
      // Xóa trong local storage
      const existingCart = await cartService.getCartItems();
      const updatedCart = existingCart.filter(item => item.id_cart !== id_cart);
      
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      console.log('✅ Removed item from local cart');
      return true;
    } catch (error) {
      console.error('❌ Error removing cart item:', error);
      return false;
    }
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async (): Promise<boolean> => {
    try {
      const userId = await cartService.getCurrentUserId();
      
      // Nếu đã đăng nhập, xóa giỏ hàng trên server
      if (userId) {
        try {
          console.log('🧹 Clearing server cart for user:', userId);
          await axios.delete(`${API_URL}/Cart/user/${userId}`);
          console.log('✅ Cleared server cart');
          return true;
        } catch (error) {
          console.error('❌ Error clearing server cart:', error);
          // Fallback to local storage if server request fails
        }
      }
      
      // Xóa giỏ hàng trong local storage
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      console.log('✅ Cleared local cart');
      return true;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return false;
    }
  },

  // Đồng bộ giỏ hàng local lên server khi đăng nhập
  syncCartToServer: async (userId: string): Promise<boolean> => {
    try {
      console.log('🔄 Starting cart sync to server for user:', userId);
      
      // Lấy giỏ hàng từ local storage
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (!cartData) {
        console.log('✅ No local cart to sync');
        return true; // Không có gì để đồng bộ
      }
      
      const localCart: CartItem[] = JSON.parse(cartData);
      if (localCart.length === 0) {
        console.log('✅ Empty local cart, nothing to sync');
        return true;
      }
      
      console.log(`🔄 Syncing ${localCart.length} items from local cart to server`);
      
      // Đồng bộ từng sản phẩm
      for (const localItem of localCart) {
        const cartData = {
          id_user: userId,
          id_product: localItem.id_product,
          name_product: localItem.name_product,
          price_product: localItem.price_product,
          count: localItem.count,
          image: localItem.image,
          size: localItem.size,
          originalPrice: localItem.originalPrice
        };
        
        await axios.post(`${API_URL}/Cart`, cartData);
      }
      
      // Xóa giỏ hàng local sau khi đồng bộ
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      console.log('✅ Successfully synced cart to server and cleared local cart');
      
      return true;
    } catch (error) {
      console.error('❌ Error syncing cart to server:', error);
      return false;
    }
  },

  // Lấy thông tin tổng hợp giỏ hàng
  getCartSummary: async (): Promise<CartSummary> => {
    try {
      const items = await cartService.getCartItems();
      const totalPrice = items.reduce((sum, item) => sum + (item.price_product * item.count), 0);
      const totalItems = items.reduce((sum, item) => sum + item.count, 0);

      return {
        items,
        totalPrice,
        totalItems
      };
    } catch (error) {
      console.error('❌ Error getting cart summary:', error);
      return {
        items: [],
        totalPrice: 0,
        totalItems: 0
      };
    }
  }
};

export default cartService; 