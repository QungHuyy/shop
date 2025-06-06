import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.45:8000';

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
      const response = await fetch(`${API_BASE_URL}/api/admin/coupon/promotion/checking?code=${code}&id_user=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check coupon');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking coupon:', error);
      throw error;
    }
  },

  // Update coupon (decrease count)
  updateCoupon: async (couponId: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/coupon/promotion/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update coupon');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  },

  // Save coupon to local storage
  saveCoupon: async (coupon: Coupon): Promise<void> => {
    try {
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
      await AsyncStorage.removeItem('id_coupon');
      await AsyncStorage.removeItem('coupon');
    } catch (error) {
      console.error('Error removing coupon from storage:', error);
    }
  }
};

export default couponService; 