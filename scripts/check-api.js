const axios = require('axios');
const { SERVER_IP, SERVER_PORT } = require('../config/api');

const API_BASE = `http://${SERVER_IP}:${SERVER_PORT}/api`;

// Danh sách các endpoint cần kiểm tra
const endpointsToCheck = [
  // User endpoints
  `${API_BASE}/User`,
  `${API_BASE}/User/detail/login`,
  
  // Product endpoints
  `${API_BASE}/Product`,
  
  // Cart endpoints
  `${API_BASE}/Cart`,
  
  // Order endpoints
  `${API_BASE}/Payment/order`,
  `${API_BASE}/DetailOrder`,
  
  // Other endpoints
  `${API_BASE}/Note`,
  `${API_BASE}/Comment`,
];

// Các trường hợp API với tham số
const testCases = [
  {
    name: 'Đăng nhập với tham số',
    url: `${API_BASE}/User/detail/login`,
    params: { username: 'testuser', password: 'testpassword' }
  }
];

async function checkEndpoint(url) {
  try {
    console.log(`Checking endpoint: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ Endpoint ${url} is accessible. Status: ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      // Endpoint exists but returned an error status
      console.log(`⚠️ Endpoint ${url} returned status: ${error.response.status}`);
      return true;
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Server connection refused at ${url}`);
      return false;
    } else {
      console.log(`❌ Error for ${url}: ${error.message}`);
      return false;
    }
  }
}

async function checkTestCase(testCase) {
  try {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    console.log(`Params: ${JSON.stringify(testCase.params)}`);
    
    const response = await axios.get(testCase.url, { 
      params: testCase.params,
      timeout: 5000 
    });
    
    console.log(`✅ Test case passed. Status: ${response.status}`);
    console.log(`Response:`, response.data);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`⚠️ Test case failed with status: ${error.response.status}`);
      console.log('Response data:', error.response.data);
      return false;
    } else {
      console.log(`❌ Test error: ${error.message}`);
      return false;
    }
  }
}

async function checkAllEndpoints() {
  console.log(`🔍 Checking API endpoints on ${API_BASE}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpointsToCheck) {
    const success = await checkEndpoint(endpoint);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n📊 API Check Summary:');
  console.log(`✅ Accessible endpoints: ${successCount}`);
  console.log(`❌ Inaccessible endpoints: ${failCount}`);
  
  console.log('\n🧪 Running API test cases:');
  let testSuccessCount = 0;
  let testFailCount = 0;
  
  for (const testCase of testCases) {
    const success = await checkTestCase(testCase);
    if (success) {
      testSuccessCount++;
    } else {
      testFailCount++;
    }
    console.log('-'.repeat(50));
  }
  
  console.log('\n📊 Test Cases Summary:');
  console.log(`✅ Successful tests: ${testSuccessCount}`);
  console.log(`❌ Failed tests: ${testFailCount}`);
  
  if (failCount > 0 || testFailCount > 0) {
    console.log('\n⚠️ Some endpoints or tests failed. Please check your backend server.');
    console.log('💡 TIP: Kiểm tra xem backend có đúng các endpoint này không:');
    console.log('- Đăng nhập: /api/User/detail/login');
    console.log('- Đăng ký: /api/User');
    console.log('- Đặt hàng: /api/Payment/order');
  } else {
    console.log('\n✅ All endpoints and tests are successful!');
  }
}

// Run the check
checkAllEndpoints(); 