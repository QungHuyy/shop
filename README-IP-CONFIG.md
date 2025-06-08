# IP Configuration Management

## Tổng quan

Hệ thống đã được cấu hình để quản lý địa chỉ IP server tại một file duy nhất. Khi cần thay đổi IP server, bạn chỉ cần cập nhật tại một nơi duy nhất:

```
shop/config/api.ts
```

## Cách thay đổi IP Server

1. Mở file `shop/config/api.ts`
2. Tìm dòng `export const SERVER_IP = '192.168.1.82';`
3. Thay đổi địa chỉ IP thành IP máy chủ mới của bạn
4. Lưu file
5. Khởi động lại ứng dụng

## Cấu trúc quản lý IP

Cấu hình IP được quản lý tập trung với cấu trúc sau:

```typescript
// Thay đổi địa chỉ IP máy chủ tại đây
export const SERVER_IP = '192.168.1.82';
export const SERVER_PORT = 8000;

// Các URL cơ sở
export const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const API_URL = `${API_BASE_URL}/api`;

// Các endpoint cụ thể 
export const USER_API = `${API_URL}/User`;
export const PRODUCT_API = `${API_URL}/Product`;
// ... các endpoint khác
```

## Cách tìm IP máy chủ của bạn

### Windows:
1. Mở Command Prompt
2. Nhập lệnh `ipconfig`
3. Tìm mục "IPv4 Address" trong kết quả

### macOS / Linux:
1. Mở Terminal
2. Nhập lệnh `ifconfig` hoặc `ip addr`
3. Tìm địa chỉ IP của mạng đang sử dụng

## Cách kiểm tra kết nối

1. Đảm bảo máy tính và thiết bị di động của bạn đang kết nối cùng một mạng
2. Khởi chạy máy chủ backend
3. Trong trình duyệt trên máy tính, truy cập: `http://{YOUR_IP}:8000/api/Product`
4. Nếu hiển thị dữ liệu JSON, kết nối đang hoạt động tốt
5. Trên ứng dụng, sử dụng tính năng Debug (từ màn hình cài đặt) để kiểm tra kết nối

## Các vấn đề thường gặp

1. **Lỗi kết nối**: Đảm bảo backend đã được khởi chạy và IP được cấu hình chính xác
2. **Timeout**: Kiểm tra firewall hoặc cài đặt bảo mật mạng
3. **CORS Error**: Đảm bảo backend có cấu hình CORS phù hợp
4. **Server không phản hồi**: Kiểm tra logs của backend để xác định vấn đề

## Phát triển trong tương lai

Để thêm endpoint API mới:
1. Cập nhật file `shop/config/api.ts` để thêm endpoint mới
2. Sử dụng biến này trong các services của ứng dụng

```typescript
// Thêm endpoint mới trong config/api.ts
export const NEW_API = `${API_URL}/NewEndpoint`;

// Export cùng với các endpoints khác
export default {
  // ... các endpoints hiện có
  NEW_API
};
``` 