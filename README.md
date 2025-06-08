# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Shop App

## Các thay đổi để khắc phục vấn đề kết nối API

### Vấn đề được phát hiện
- Endpoint `/User/login` không tồn tại, nhưng `/User/detail/login` hoạt động chính xác
- Một số endpoint như `/Cart` và `/Payment` trả về lỗi 404 Not Found
- Endpoint đơn hàng phải sử dụng `/Payment/order` thay vì `/Payment`

### Giải pháp đã thực hiện

1. **Cập nhật cấu hình API**
   - Đã sửa đường dẫn đăng nhập trong `authService.ts` từ `/login` thành `/detail/login`
   - Đã sửa đường dẫn đặt hàng trong `config/api.ts` từ `/Payment` thành `/Payment/order`

2. **Cải thiện khả năng dự phòng khi API không hoạt động**
   - Thêm timeout cho các API request để tránh đợi quá lâu
   - Tự động fallback về localStorage khi server không phản hồi
   - Đã tạo `networkHelper.ts` với các utility để xử lý các vấn đề kết nối mạng

3. **Các script kiểm tra API**
   - Cập nhật `scripts/check-api.js` để kiểm tra các endpoint chính xác
   - Thêm `scripts/test-auth.js` để kiểm tra riêng phần đăng nhập/đăng ký

### Lưu ý khi phát triển

1. **Cấu hình API**
   - Tất cả các URL API được cấu hình tại `config/api.ts` và `config/api.js`
   - Khi thêm API mới, hãy cập nhật cả hai file

2. **Xử lý lỗi**
   - Luôn sử dụng cơ chế dự phòng khi gọi API
   - Sử dụng NetworkHelper.withTimeout() để tránh request bị treo
   - Sử dụng NetworkHelper.withRetry() cho các API quan trọng

## Hướng dẫn thiết lập và chạy ứng dụng

### Yêu cầu hệ thống
- Node.js (v14.0.0 hoặc cao hơn)
- Expo CLI (v4.0.0 hoặc cao hơn)
- React Native (v0.64.0 hoặc cao hơn)

### Cài đặt
1. Clone repository
2. Chạy `npm install`
3. Cấu hình IP server trong `config/api.ts`
4. Chạy `npm start` để khởi động ứng dụng

### Kiểm tra kết nối API
Chạy `node scripts/check-api.js` để kiểm tra trạng thái kết nối của các API
