import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../config/api';

import orderHistoryService from './orderHistoryService';

export interface Coupon {
  _id: string;
  code: string;
  count: number;
  promotion: string;
  describe: string;
}

const couponService = {
  // Check coupon validity
  checkCoupon: async (code: string, userId: string): Promise<any> => {
    try {
      console.log(`Checking coupon: ${code} for user: ${userId}`);
      
      // Gọi API kiểm tra mã giảm giá
      const response = await fetch(`${COUPON_API}/promotion/checking?code=${code}&id_user=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error('Failed to check coupon');
      }

      const result = await response.json();
      console.log('API coupon check result:', result);
      
      // API đã xử lý việc kiểm tra đơn hàng hoàn thành hoặc đang xử lý
      return result;
    } catch (error) {
      console.error('Error checking coupon:', error);
      throw error;
    }
  },

  // Update coupon (decrease count)
  updateCoupon: async (couponId: string): Promise<any> => {
    try {
      console.log(`Updating coupon: ${couponId}`);
      
      const response = await fetch(`${COUPON_API}/promotion/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error('Failed to update coupon');
      }

      const result = await response.json();
      console.log('Update coupon result:', result);
      return result;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  },
  
  // Restore coupon when order is canceled
  restoreCoupon: async (couponId: string, orderId: string): Promise<any> => {
    try {
      console.log(`Restoring coupon: ${couponId} for order: ${orderId}`);
      
      const response = await fetch(`${COUPON_API}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_coupon: couponId,
          id_order: orderId
        }),
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error('Failed to restore coupon');
      }

      const result = await response.json();
      console.log('Restore coupon result:', result);
      return result;
    } catch (error) {
      console.error('Error restoring coupon:', error);
      throw error;
    }
  },

  // Save coupon to local storage
  saveCoupon: async (coupon: Coupon): Promise<void> => {
    try {
      console.log(`Saving coupon to storage: ${coupon._id}`);
      await AsyncStorage.setItem('id_coupon', coupon._id);
      await AsyncStorage.setItem('coupon', JSON.stringify(coupon));
    } catch (error) {
      console.error('Error saving coupon to storage:', error);
      throw error;
    }
  },

  // Get saved coupon from local storage
  getSavedCoupon: async (): Promise<{ id: string; coupon: Coupon | null }> => {
    try {
      const id = await AsyncStorage.getItem('id_coupon');
      const couponString = await AsyncStorage.getItem('coupon');
      
      console.log(`Retrieved coupon from storage: ${id || 'none'}`);
      return {
        id: id || '',
        coupon: couponString ? JSON.parse(couponString) : null
      };
    } catch (error) {
      console.error('Error getting coupon from storage:', error);
      return { id: '', coupon: null };
    }
  },

  // Remove coupon from local storage
  removeCoupon: async (): Promise<void> => {
    try {
      console.log('Removing coupon from storage');
      await AsyncStorage.removeItem('id_coupon');
      await AsyncStorage.removeItem('coupon');
    } catch (error) {
      console.error('Error removing coupon from storage:', error);
    }
  }
};

export default couponService; 