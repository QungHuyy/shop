/**
 * Script to update all service files to use the centralized config
 * This will scan all service files and replace hardcoded IP addresses with imports
 * from the centralized config file
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting service config update script...');

// Thư mục chứa các file service
const servicesDir = path.join(__dirname, '../services');
console.log('📂 Services directory:', servicesDir);

// IP cũ
const oldIPs = ['192.168.1.45', '192.168.1.82'];

// Mẫu import cho config
const configImport = "import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../config/api';";

// Đọc danh sách file trong thư mục
const files = fs.readdirSync(servicesDir);

// Lọc các file TypeScript
const tsFiles = files.filter(file => file.endsWith('.ts'));

console.log(`Đang cập nhật cấu hình cho ${tsFiles.length} file...`);

// Thay đổi IP trong từng file
let updatedFiles = 0;

tsFiles.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let originalContent = content;
  
  console.log(`\n🔍 Checking file: ${file}`);
  
  // Check if file already has config import
  if (!content.includes("from '../config/api'")) {
    // Add import statement at the top after other imports
    const importRegex = /(import .+;[\r\n]+)/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, "$1" + configImport + "\n\n");
      modified = true;
      console.log('  ✅ Added config import');
    }
  }
  
  // Replace hardcoded API URLs
  oldIPs.forEach(ip => {
    if (content.includes(ip)) {
      console.log(`  🔎 Found IP: ${ip} in file`);
      
      // Replace constant declarations first
      const constAPIPattern = new RegExp(`const\\s+API(_URL|_BASE_URL)\\s*=\\s*['"]http://${ip}:8000(/api)?['"];`, 'g');
      if (constAPIPattern.test(content)) {
        content = content.replace(constAPIPattern, '// Using centralized config import instead');
        modified = true;
        console.log('  ✅ Replaced constant declaration');
      }
      
      // Then replace URLs in other places
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
  
  // If changes were made, save the file
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated file: ${file}`);
    updatedFiles++;
  } else {
    console.log(`❌ No changes needed for: ${file}`);
  }
});

console.log(`\nHoàn tất! Đã cập nhật ${updatedFiles}/${tsFiles.length} file.`);
console.log('📋 Các file đã được cập nhật để sử dụng cấu hình tập trung từ config/api.ts');
console.log('💡 Từ giờ bạn chỉ cần thay đổi địa chỉ IP tại một nơi duy nhất: shop/config/api.ts'); 