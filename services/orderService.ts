import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../config/api';
import axios from 'axios';

export interface OrderData {
  id_user: string;
  address: string;
  total: number;
  status: string;
  pay: boolean;
  id_payment: string;
  id_note: string;
  feeship: number;
  id_coupon: string;
  create_time: string;
}

export interface NoteData {
  fullname: string;
  phone: string;
}

export interface DetailOrderData {
  id_order: string;
  id_product: string;
  name_product: string;
  price_product: string;
  count: number;
  size: string;
  inventory: {
    [key: string]: number;
  };
}

export interface OrderFormData {
  fullname: string;
  phone: string;
  address: string;
  email: string;
}

export interface OrderSummary {
  _id: string;
  id_user: string;
  address: string;
  total: number;
  status: string;
  pay: boolean;
  id_payment: string;
  id_note: string;
  feeship: number;
  id_coupon?: string;
  create_time: string;
}

export interface OrderDetail {
  _id: string;
  id_order: string;
  id_product: string;
  name_product: string;
  price_product: number;
  count: number;
  size: string;
}

const orderService = {
  // Create note (delivery information)
  createNote: async (noteData: NoteData): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/Note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  // Create order
  createOrder: async (data: OrderData): Promise<any> => {
    try {
      console.log('📦 Creating order with data:', data);
      
      // Gọi API tạo đơn hàng
      const response = await axios.post(ORDER_API, data);
      
      console.log('✅ Order created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  },

  // Create detail order
  createDetailOrder: async (detailData: DetailOrderData): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/DetailOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detailData),
      });

      if (!response.ok) {
        throw new Error('Failed to create detail order');
      }

      // Server trả về string "Thanh Cong", không phải JSON
      return await response.text();
    } catch (error) {
      console.error('Error creating detail order:', error);
      throw error;
    }
  },

  // Place order (complete process)
  placeOrder: async (
    formData: OrderFormData,
    cartItems: any[],
    totalPrice: number,
    userId: string,
    couponId: string = ""
  ): Promise<boolean> => {
    try {
      // Step 1: Create note
      const noteData: NoteData = {
        fullname: formData.fullname,
        phone: formData.phone,
      };

      const noteResponse = await orderService.createNote(noteData);

      // Step 2: Create order
      const orderData: OrderData = {
        id_user: userId,
        address: formData.address,
        total: totalPrice,
        status: "1", // Đang xử lý
        pay: false,
        id_payment: "6086709cdc52ab1ae999e882", // Default payment method
        id_note: noteResponse._id,
        feeship: 0,
        id_coupon: couponId,
        create_time: `${new Date().getDate()}/${(new Date().getMonth() + 1).toString()}/${new Date().getFullYear()}`,
      };

      const orderResponse = await orderService.createOrder(orderData);

      // Step 3: Create detail orders for each cart item
      for (const item of cartItems) {
        const detailData: DetailOrderData = {
          id_order: orderResponse._id,
          id_product: item.id_product,
          name_product: item.name_product,
          price_product: item.price_product.toString(),
          count: item.count,
          size: item.size,
          inventory: {
            [item.size]: item.count
          },
        };

        // Gọi createDetailOrder và ignore result (như web client)
        await orderService.createDetailOrder(detailData);
      }

      // Step 4: BỎ email API call - web client không gọi

      return true;
    } catch (error) {
      console.error('Error placing order:', error);
      return false;
    }
  },

  // Lấy tất cả đơn hàng của người dùng
  getUserOrders: async (userId: string): Promise<OrderSummary[]> => {
    try {
      console.log('📋 Fetching orders for user:', userId);
      // Sử dụng Payment/order/[id] endpoint theo cấu trúc backend
      const response = await axios.get(`${API_URL}/Payment/order/${userId}`);
      
      if (response.data) {
        console.log(`✅ Fetched ${response.data.length} orders`);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching user orders:', error);
      return [];
    }
  },

  // Lấy chi tiết một đơn hàng
  getOrderDetails: async (orderId: string): Promise<OrderDetail[]> => {
    try {
      console.log('🔍 Fetching details for order:', orderId);
      // Sử dụng Payment/order/detail/[id] endpoint theo cấu trúc backend
      const response = await axios.get(`${API_URL}/Payment/order/detail/${orderId}`);
      
      if (response.data) {
        console.log(`✅ Fetched ${response.data.length} order details`);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      return [];
    }
  },
};

export default orderService; 