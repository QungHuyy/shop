// Network helper utilities for testing server connection

export class NetworkHelper {
  static async testServerConnection(baseUrl: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log(`Testing connection to: ${baseUrl}/api/Product`);
      
      const response = await fetch(`${baseUrl}/api/Product`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Server returned error: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `Successfully connected! Found ${Array.isArray(data) ? data.length : 0} products`,
        details: { productCount: Array.isArray(data) ? data.length : 0 }
      };

    } catch (error: any) {
      let message = 'Unknown connection error';
      
      if (error.message?.includes('Network request failed')) {
        message = 'Cannot connect to server. Please check:\n1. Server is running on port 8000\n2. IP address is correct\n3. Same WiFi network';
      } else if (error.message?.includes('timeout')) {
        message = 'Connection timeout. Server may be slow or unreachable';
      } else if (error.message?.includes('fetch')) {
        message = 'Network error. Check internet connection';
      } else {
        message = error.message || 'Connection failed';
      }

      return {
        success: false,
        message,
        details: { error: error.message }
      };
    }
  }

  static getSetupInstructions(): string {
    return `
🔧 HƯỚNG DẪN SETUP BACKEND:

1️⃣ Khởi chạy backend:
   cd server_app-main
   npm install
   npm start

2️⃣ Tìm địa chỉ IP máy tính:
   Windows: ipconfig
   Mac/Linux: ifconfig
   
3️⃣ Cập nhật IP trong productService.ts:
   const API_BASE_URL = 'http://YOUR_IP:8000';
   
4️⃣ Đảm bảo cùng mạng WiFi:
   - Máy tính và điện thoại cùng WiFi
   - Tắt firewall nếu cần
   
5️⃣ Kiểm tra database:
   - MongoDB đã có dữ liệu sản phẩm
   - Kết nối database thành công

📱 Test trên browser: http://YOUR_IP:8000/api/Product
    `;
  }

  static async findLocalIP(): Promise<string[]> {
    // This is a placeholder - in React Native we can't directly get local IP
    // Users need to find it manually using ipconfig/ifconfig
    return [
      '192.168.1.100', // Common router IP range
      '192.168.0.100',
      '10.0.0.100',
      'localhost'
    ];
  }
}

export default NetworkHelper; 