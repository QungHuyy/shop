import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../config/api';

export interface OrderHistory {
  _id: string;
  id_user: string;
  address: string;
  total: number;
  status: string;
  pay: boolean;
  feeship: number;
  id_coupon: string;
  create_time: string;
  id_note: {
    _id: string;
    fullname: string;
    phone: string;
  };
  id_payment?: {
    _id: string;
    pay_name: string;
  };
}

export interface OrderDetail {
  _id: string;
  id_order: string;
  id_product: {
    _id: string;
    name_product: string;
    image: string;
    price_product: string;
  };
  name_product: string;
  price_product: string;
  count: number;
  size: string;
}

export interface OrderDetailWithProducts extends OrderHistory {
  products: {
    _id: string;
    name: string;
    img: string;
    price: number;
    quantity: number;
    size?: string;
  }[];
  id_note: {
    _id: string;
    fullname: string;
    phone: string;
    email: string;
  };
}

const orderHistoryService = {
  // Get order history by user ID
  getOrderHistory: async (userId: string): Promise<OrderHistory[]> => {
    try {
      console.log(`Fetching order history for user ${userId}`);
      
      const response = await fetch(`${ORDER_API}/order/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error('Failed to get order history');
      }

      const orders = await response.json();
      console.log(`Received ${orders.length} orders from API`);
      
      // Đảm bảo đơn hàng đã hủy (status = 0 hoặc 5) được hiển thị đúng
      const processedOrders = orders.map((order: OrderHistory) => {
        // Đảm bảo status là string
        const orderCopy = {...order};
        if (orderCopy.status === '5') {
          orderCopy.status = '0';
        }
        return orderCopy;
      });
      
      console.log(`Processed ${processedOrders.length} orders for display`);
      console.log('Order statuses:', processedOrders.map((o: OrderHistory) => o.status));
      
      return processedOrders;
    } catch (error) {
      console.error('Error getting order history:', error);
      throw error;
    }
  },

  // Get order detail by order ID
  getOrderDetail: async (orderId: string): Promise<OrderHistory> => {
    try {
      const response = await fetch(`${ORDER_API}/order/detail/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get order detail');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting order detail:', error);
      throw error;
    }
  },

  // Get order items (detail_order)
  getOrderItems: async (orderId: string): Promise<OrderDetail[]> => {
    try {
      const response = await fetch(`${API_URL}/DetailOrder/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get order items');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting order items:', error);
      throw error;
    }
  },

  // Cancel order (for status 1 and 2 only)
  cancelOrder: async (orderId: string): Promise<boolean> => {
    try {
      // Lấy thông tin đơn hàng trước khi hủy để kiểm tra mã giảm giá
      const orderDetail = await orderHistoryService.getOrderDetail(orderId);
      
      const response = await fetch(`${API_URL}/admin/Order/cancelorder?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Cancel order response:', await response.text());
        throw new Error('Failed to cancel order');
      }

      return true;
    } catch (error) {
      console.error('Error canceling order:', error);
      return false;
    }
  },

  // Format status for display
  getStatusText: (status: string): string => {
    switch (status) {
      case '1': return 'Đang xử lý';
      case '2': return 'Đã xác nhận';
      case '3': return 'Đang giao';
      case '4': return 'Hoàn thành';
      default: return 'Đã hủy';
    }
  },

  // Get status color
  getStatusColor: (status: string): string => {
    switch (status) {
      case '1': return '#ffa502'; // Orange
      case '2': return '#3742fa'; // Blue  
      case '3': return '#2ed573'; // Green
      case '4': return '#28a745'; // Success green
      default: return '#ff4757'; // Red
    }
  },

  // Check if order can be cancelled
  canCancelOrder: (status: string, isPaid: boolean): boolean => {
    return (status === '1' || status === '2') && !isPaid;
  },

  // Format price
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  // Track order status with polling
  trackOrderStatus: async (orderId: string, onStatusChange?: (newStatus: string, oldStatus: string) => void): Promise<string> => {
    try {
      const order = await orderHistoryService.getOrderDetail(orderId);
      return order.status;
    } catch (error) {
      console.error('Error tracking order status:', error);
      throw error;
    }
  },

  // Get next expected status
  getNextExpectedStatus: (currentStatus: string): string | null => {
    switch (currentStatus) {
      case '1': return '2'; // Đang xử lý → Đã xác nhận
      case '2': return '3'; // Đã xác nhận → Đang giao
      case '3': return '4'; // Đang giao → Hoàn thành
      case '4': return null; // Hoàn thành (final)
      default: return null;
    }
  },

  // Get progress percentage
  getProgressPercentage: (status: string): number => {
    switch (status) {
      case '1': return 25;  // Đang xử lý
      case '2': return 50;  // Đã xác nhận  
      case '3': return 75;  // Đang giao
      case '4': return 100; // Hoàn thành
      default: return 0;
    }
  },

  // Check if status is final
  isFinalStatus: (status: string): boolean => {
    return status === '4' || status === '0'; // Hoàn thành hoặc Đã hủy
  },

  // Get estimated delivery time based on status
  getEstimatedDeliveryMessage: (status: string): string => {
    switch (status) {
      case '1': return 'Đơn hàng đang được xử lý, dự kiến xác nhận trong 24h';
      case '2': return 'Đơn hàng đã được xác nhận, chuẩn bị giao hàng trong 1-2 ngày';
      case '3': return 'Đơn hàng đang được giao, dự kiến nhận hàng trong 1-3 ngày';
      case '4': return 'Đơn hàng đã được giao thành công';
      default: return 'Đơn hàng đã bị hủy';
    }
  },

  // Lấy lịch sử đơn hàng của người dùng
  getUserOrders: async (userId: string): Promise<OrderHistory[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Payment/order/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order history:', error);
      return [];
    }
  },

  // Kiểm tra xem người dùng đã từng sử dụng mã giảm giá nào chưa
  checkUsedCoupons: async (userId: string): Promise<string[]> => {
    try {
      const orders = await orderHistoryService.getUserOrders(userId);
      
      // Lọc ra các id_coupon không rỗng
      const usedCouponIds = orders
        .filter(order => order.id_coupon && order.id_coupon.trim() !== '')
        .map(order => order.id_coupon);
      
      // Loại bỏ các id trùng lặp
      return [...new Set(usedCouponIds)];
    } catch (error) {
      console.error('Error checking used coupons:', error);
      return [];
    }
  },

  // Kiểm tra xem người dùng đã sử dụng một mã giảm giá cụ thể chưa
  hasUsedCoupon: async (userId: string, couponId: string): Promise<boolean> => {
    try {
      console.log(`Checking if user ${userId} has used coupon ${couponId}`);
      
      // Gọi API kiểm tra trực tiếp
      const response = await fetch(`${API_BASE_URL}/api/admin/coupon/promotion/checking?code=DUMMY&id_user=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        return false;
      }
      
      // Lấy tất cả đơn hàng của người dùng
      const orders = await orderHistoryService.getUserOrders(userId);
      
      // Kiểm tra xem có đơn hàng nào đã hoàn thành (status = 4) sử dụng mã giảm giá này không
      const completedOrderWithCoupon = orders.find(order => 
        order.id_coupon === couponId && order.status === '4'
      );
      
      // Nếu có đơn hàng hoàn thành với mã giảm giá này, trả về true
      if (completedOrderWithCoupon) {
        console.log(`Found completed order with coupon ${couponId}`);
        return true;
      }
      
      // Kiểm tra xem có đơn hàng nào đang xử lý (status = 1,2,3) sử dụng mã giảm giá này không
      const pendingOrderWithCoupon = orders.find(order => 
        order.id_coupon === couponId && 
        ['1', '2', '3'].includes(order.status)
      );
      
      // Nếu có đơn hàng đang xử lý với mã giảm giá này, trả về true
      const result = !!pendingOrderWithCoupon;
      console.log(`User ${userId} ${result ? 'has' : 'has not'} used coupon ${couponId}`);
      return result;
    } catch (error) {
      console.error('Error checking if coupon was used:', error);
      return false;
    }
  }
};

export default orderHistoryService; 