/**
 * Cấu hình API cho ứng dụng
 * 
 * ⚠️ QUAN TRỌNG: Thay đổi địa chỉ IP máy chủ chỉ tại file này
 * Các dịch vụ sẽ tự động sử dụng cấu hình từ file này
 */


export const SERVER_IP = '192.168.1.82';
export const SERVER_PORT = 8000;

// Các URL cơ sở
export const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const API_URL = `${API_BASE_URL}/api`;

// Các endpoint cụ thể - Đã sửa để khớp với backend
export const USER_API = `${API_URL}/User`;
export const PRODUCT_API = `${API_URL}/Product`;
export const CART_API = `${API_URL}/Cart`;
export const FAVORITE_API = `${API_URL}/Favorite`;
export const COMMENT_API = `${API_URL}/Comment`;
export const COUPON_API = `${API_URL}/admin/coupon`;
export const ORDER_API = `${API_URL}/Payment/order`; // Sửa lại thành Payment/order theo backend
export const DETAIL_ORDER_API = `${API_URL}/DetailOrder`; // Thêm endpoint cho chi tiết đơn hàng
export const NOTE_API = `${API_URL}/Note`; // Thêm endpoint cho ghi chú
export const SALE_API = `${API_URL}/admin/sale`;
export const CHATBOT_API = `${API_URL}/Chatbot`;
export const IMAGE_SEARCH_API = `${API_URL}/ImageSearch`;

// API tìm kiếm hình ảnh - đây là API của bên thứ ba, không phải server của bạn
export const EXTERNAL_IMAGE_SEARCH_API = `https://search-by-ai-e2av.onrender.com/search-by-image`;

// Hàm trợ giúp để kiểm tra kết nối
export const getConnectionInstructions = () => {
  return `
🔧 HƯỚNG DẪN SETUP BACKEND:

1️⃣ Khởi chạy backend:
   cd server_app-main
   npm install
   npm start

2️⃣ Tìm địa chỉ IP máy tính:
   Windows: ipconfig
   Mac/Linux: ifconfig
   
3️⃣ Cập nhật IP trong config/api.ts:
   export const SERVER_IP = 'YOUR_IP';
   
4️⃣ Đảm bảo cùng mạng WiFi:
   - Máy tính và điện thoại cùng WiFi
   - Tắt firewall nếu cần

5️⃣ Kiểm tra database:
   - MongoDB đã có dữ liệu sản phẩm
   - Kết nối database thành công

📱 Test trên browser: http://${SERVER_IP}:${SERVER_PORT}/api/Product
  `;
};

// Export tất cả biến như một đối tượng để dễ import
export default {
  SERVER_IP,
  SERVER_PORT,
  API_BASE_URL,
  API_URL,
  USER_API,
  PRODUCT_API,
  CART_API,
  FAVORITE_API,
  COMMENT_API,
  COUPON_API,
  ORDER_API,
  DETAIL_ORDER_API,
  NOTE_API,
  SALE_API,
  CHATBOT_API,
  IMAGE_SEARCH_API,
  EXTERNAL_IMAGE_SEARCH_API,
  getConnectionInstructions
}; 