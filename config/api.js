// /**
//  * Cấu hình API cho ứng dụng
//  * 
//  * ⚠️ QUAN TRỌNG: Thay đổi địa chỉ IP máy chủ chỉ tại file này
//  * Các dịch vụ sẽ tự động sử dụng cấu hình từ file này
//  */

// const SERVER_IP = '192.168.1.82';
// const SERVER_PORT = 8000;

// // Các URL cơ sở
// const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
// const API_URL = `${API_BASE_URL}/api`;

// // Các endpoint cụ thể - Đã sửa để khớp với backend
// const USER_API = `${API_URL}/User`;
// const PRODUCT_API = `${API_URL}/Product`;
// const CART_API = `${API_URL}/Cart`;
// const FAVORITE_API = `${API_URL}/Favorite`;
// const COMMENT_API = `${API_URL}/Comment`;
// const COUPON_API = `${API_URL}/admin/coupon`;
// const ORDER_API = `${API_URL}/Payment/order`; // Sửa lại thành Payment/order theo backend
// const DETAIL_ORDER_API = `${API_URL}/DetailOrder`; // Thêm endpoint cho chi tiết đơn hàng
// const NOTE_API = `${API_URL}/Note`; // Thêm endpoint cho ghi chú
// const SALE_API = `${API_URL}/admin/sale`;
// const CHATBOT_API = `${API_URL}/Chatbot`;
// const IMAGE_SEARCH_API = `${API_URL}/ImageSearch`;

// // API tìm kiếm hình ảnh 
// const EXTERNAL_IMAGE_SEARCH_API = `https://https://search-by-ai-e2av.onrender.com/search-by-image`;

// // Hàm trợ giúp để kiểm tra kết nối
// const getConnectionInstructions = () => {
//   return `
// 🔧 HƯỚNG DẪN SETUP BACKEND:

// 1️⃣ Khởi chạy backend:
//    cd server_app-main
//    npm install
//    npm start

// 2️⃣ Tìm địa chỉ IP máy tính:
//    Windows: ipconfig
//    Mac/Linux: ifconfig
   
// 3️⃣ Cập nhật IP trong config/api.ts:
//    export const SERVER_IP = 'YOUR_IP';
   
// 4️⃣ Đảm bảo cùng mạng WiFi:
//    - Máy tính và điện thoại cùng WiFi
//    - Tắt firewall nếu cần

// 5️⃣ Kiểm tra database:
//    - MongoDB đã có dữ liệu sản phẩm
//    - Kết nối database thành công

// 📱 Test trên browser: http://${SERVER_IP}:${SERVER_PORT}/api/Product
//   `;
// };

// // Export tất cả biến sử dụng module.exports (CommonJS)
// module.exports = {
//   SERVER_IP,
//   SERVER_PORT,
//   API_BASE_URL,
//   API_URL,
//   USER_API,
//   PRODUCT_API,
//   CART_API,
//   FAVORITE_API,
//   COMMENT_API,
//   COUPON_API,
//   ORDER_API,
//   DETAIL_ORDER_API,
//   NOTE_API,
//   SALE_API,
//   CHATBOT_API,
//   IMAGE_SEARCH_API,
//   EXTERNAL_IMAGE_SEARCH_API,
//   getConnectionInstructions
// }; 