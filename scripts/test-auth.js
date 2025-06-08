/**
 * Script kiểm tra API đăng nhập và đăng ký
 * Chạy với lệnh: node scripts/test-auth.js
 */

const axios = require('axios');
const { SERVER_IP, SERVER_PORT, USER_API } = require('../config/api');

const API_BASE = `http://${SERVER_IP}:${SERVER_PORT}/api`;

// Thông tin đăng nhập thử nghiệm (hãy thay đổi thành thông tin thực tế)
const testCredentials = {
  username: 'test',
  password: 'test123'
};

// Thông tin đăng ký thử nghiệm
const testSignupData = {
  username: `test${Date.now()}`, // Tạo username ngẫu nhiên để tránh trùng lặp
  password: 'test123',
  fullname: 'Test User',
  email: `test${Date.now()}@example.com`,
  phone: `0987${Math.floor(Math.random() * 1000000)}`,
  gender: '', 
  id_permission: "6087dcb5f269113b3460fce4" // ID permission mặc định cho user
};

// Kiểm tra các endpoint đăng nhập
async function testLogin() {
  console.log('\n🔐 KIỂM TRA ĐĂNG NHẬP');
  console.log('-'.repeat(50));
  
  let loginResult = { success: false, endpoint: '', message: '' };
  
  // 1. Kiểm tra /login endpoint
  console.log('1. Test endpoint /login:');
  try {
    console.log(`URL: ${USER_API}/login`);
    console.log(`Thông tin đăng nhập:`, testCredentials);
    
    const response = await axios.get(`${USER_API}/login`, {
      params: testCredentials,
      timeout: 5000
    });
    
    console.log(`✅ Đăng nhập thành công! Status: ${response.status}`);
    console.log(`Thông tin người dùng:`, response.data);
    
    loginResult = { 
      success: true, 
      endpoint: '/login',
      message: 'Có thể sử dụng endpoint /login cho đăng nhập'
    };
  } catch (error) {
    console.log(`❌ Đăng nhập thất bại với /login`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    } else {
      console.log(`Error:`, error.message);
    }
  }
  
  // 2. Kiểm tra /detail/login endpoint
  console.log('\n2. Test endpoint /detail/login:');
  try {
    console.log(`URL: ${USER_API}/detail/login`);
    console.log(`Thông tin đăng nhập:`, testCredentials);
    
    const response = await axios.get(`${USER_API}/detail/login`, {
      params: testCredentials,
      timeout: 5000
    });
    
    console.log(`✅ Đăng nhập thành công với /detail/login! Status: ${response.status}`);
    console.log(`Thông tin người dùng:`, response.data);
    
    // Nếu endpoint /login không hoạt động, sử dụng kết quả của /detail/login
    if (!loginResult.success) {
      loginResult = { 
        success: true, 
        endpoint: '/detail/login',
        message: 'Cần sử dụng endpoint /detail/login cho đăng nhập'
      };
    }
  } catch (error) {
    console.log(`❌ Đăng nhập thất bại với /detail/login`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    } else {
      console.log(`Error:`, error.message);
    }
  }
  
  // Kết luận
  console.log('\n📝 Kết luận về API đăng nhập:');
  if (loginResult.success) {
    console.log(`✅ Đăng nhập thành công với endpoint: ${loginResult.endpoint}`);
    console.log(`💡 ${loginResult.message}`);
    return true;
  } else {
    console.log('❌ Không thể đăng nhập với bất kỳ endpoint nào!');
    return false;
  }
}

async function testSignup() {
  console.log('\n📝 KIỂM TRA ĐĂNG KÝ');
  console.log('-'.repeat(50));
  
  try {
    console.log(`URL: ${USER_API}`);
    console.log(`Thông tin đăng ký:`, testSignupData);
    
    const response = await axios.post(USER_API, testSignupData);
    
    console.log(`✅ Đăng ký thành công! Status: ${response.status}`);
    console.log(`Kết quả:`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ Đăng ký thất bại`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
      
      // Kiểm tra nếu lỗi là do thông tin đăng ký không hợp lệ
      if (typeof error.response.data === 'string' && 
          (error.response.data.includes('Ton Tai'))) {
        console.log('⚠️ Lỗi này có thể do thông tin đăng ký đã tồn tại, endpoint hoạt động bình thường');
        return true;
      }
    } else {
      console.log(`Error:`, error.message);
    }
  }
  
  return false;
}

async function runAllTests() {
  console.log('🧪 BẮT ĐẦU KIỂM TRA API XÁC THỰC');
  console.log('='.repeat(50));
  console.log(`🌐 Server API: ${API_BASE}`);
  console.log(`👤 User API: ${USER_API}`);
  
  const loginSuccess = await testLogin();
  const signupSuccess = await testSignup();
  
  console.log('\n📊 KẾT QUẢ KIỂM TRA');
  console.log('='.repeat(50));
  console.log(`Đăng nhập: ${loginSuccess ? '✅ OK' : '❌ Lỗi'}`);
  console.log(`Đăng ký: ${signupSuccess ? '✅ OK' : '❌ Lỗi'}`);
  
  if (!loginSuccess || !signupSuccess) {
    console.log('\n❗ HƯỚNG DẪN SỬA LỖI');
    
    if (!loginSuccess) {
      console.log('1. Kiểm tra endpoint đăng nhập:');
      console.log('   - Thử thay đổi URL từ /login thành /detail/login trong file authService.ts');
      console.log('   - Hoặc kiểm tra backend có đúng endpoint đăng nhập là /api/User/login không');
    }
    
    if (!signupSuccess) {
      console.log('2. Kiểm tra endpoint đăng ký:');
      console.log('   - Đảm bảo endpoint đăng ký là /api/User');
      console.log('   - Kiểm tra cấu trúc dữ liệu đăng ký phù hợp với yêu cầu của backend');
    }
  } else {
    console.log('\n✅ Tất cả các kiểm tra đều thành công!');
  }
}

// Chạy kiểm tra
runAllTests(); 