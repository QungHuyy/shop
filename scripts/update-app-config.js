/**
 * Script to update app components to use the centralized config
 * This will scan all app components and replace hardcoded IP addresses with imports
 * from the centralized config file
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting app config update script...');

// Thư mục chứa các file app
const appDir = path.join(__dirname, '../app');
console.log('📂 App directory:', appDir);

// IP cũ
const oldIPs = ['192.168.1.45', '192.168.1.82', '192.168.1.100'];

// Mẫu import cho config
const configImport = "import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../../config/api';";

// Hàm đọc thư mục đệ quy
function readDirRecursive(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Đệ quy vào thư mục con
      results = results.concat(readDirRecursive(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Chỉ lấy file TypeScript
      results.push(filePath);
    }
  });
  
  return results;
}

// Lấy danh sách file
const tsFiles = readDirRecursive(appDir);
console.log(`Đang cập nhật cấu hình cho ${tsFiles.length} file...`);

// Thay đổi IP trong từng file
let updatedFiles = 0;

tsFiles.forEach(filePath => {
  const file = path.relative(appDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`\n🔍 Checking file: ${file}`);
  
  // Check for hardcoded IPs
  let hasHardcodedIP = false;
  oldIPs.forEach(ip => {
    if (content.includes(ip)) {
      hasHardcodedIP = true;
      console.log(`  🔎 Found IP: ${ip} in file`);
    }
  });
  
  if (hasHardcodedIP) {
    // Determine the relative path to config from this file
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../config')).replace(/\\/g, '/');
    const configImportPath = relativePath === '' ? './config/api' : `${relativePath}/api`;
    console.log(`  📍 Config path from here: ${configImportPath}`);
    
    const adjustedConfigImport = `import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '${configImportPath}';`;
    
    // Check if file already has config import
    if (!content.includes(configImportPath)) {
      // Add import statement at the top after other imports
      const importRegex = /(import .+;[\r\n]+)/;
      if (importRegex.test(content)) {
        content = content.replace(importRegex, "$1" + adjustedConfigImport + "\n\n");
        modified = true;
        console.log('  ✅ Added config import');
      }
    }
    
    // Replace hardcoded API URLs
    oldIPs.forEach(ip => {
      if (content.includes(ip)) {
        // Replace fetch and axios calls
        const urlPatterns = [
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/User(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/User`, 'USER_API');
              }
              return 'USER_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/Product(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/Product`, 'PRODUCT_API');
              }
              return 'PRODUCT_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/Cart(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/Cart`, 'CART_API');
              }
              return 'CART_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/Favorite(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/Favorite`, 'FAVORITE_API');
              }
              return 'FAVORITE_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/Comment(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/Comment`, 'COMMENT_API');
              }
              return 'COMMENT_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/admin/coupon(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/admin/coupon`, 'COUPON_API');
              }
              return 'COUPON_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/Payment(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/Payment`, 'ORDER_API');
              }
              return 'ORDER_API';
            }
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api/Chatbot(/[^'"]*)?['"]`, 'g'),
            replacement: (match) => {
              if (match.includes('/')) {
                return match.replace(`http://${ip}:8000/api/Chatbot`, 'CHATBOT_API');
              }
              return 'CHATBOT_API';
            }
          },
          // General API URLs if no specific matches
          { 
            regex: new RegExp(`['"]http://${ip}:8000/api['"]`, 'g'),
            replacement: 'API_URL'
          },
          { 
            regex: new RegExp(`['"]http://${ip}:8000['"]`, 'g'),
            replacement: 'API_BASE_URL'
          },
          // Template strings
          { 
            regex: new RegExp(`\`http://${ip}:8000/api(/[^'"\`]*)\``, 'g'),
            replacement: (match) => {
              if (match.includes('${')) {
                return match.replace(`http://${ip}:8000/api`, '${API_URL}');
              }
              return match.replace(`http://${ip}:8000/api`, 'API_URL');
            }
          }
        ];

        urlPatterns.forEach(pattern => {
          const tempContent = content;
          content = content.replace(pattern.regex, pattern.replacement);
          if (tempContent !== content) {
            modified = true;
            console.log(`  ✅ Replaced URL pattern: ${pattern.regex}`);
          }
        });
      }
    });
  }
  
  // If changes were made, save the file
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated file: ${file}`);
    updatedFiles++;
  } else if (hasHardcodedIP) {
    console.log(`❌ IP found but no replacements made for: ${file}`);
  }
});

console.log(`\nHoàn tất! Đã cập nhật ${updatedFiles}/${tsFiles.length} file.`);
console.log('📋 Các file đã được cập nhật để sử dụng cấu hình tập trung từ config/api.ts');
console.log('💡 Từ giờ bạn chỉ cần thay đổi địa chỉ IP tại một nơi duy nhất: shop/config/api.ts'); 