const fs = require('fs');
const path = require('path');

// Thư mục chứa các file service
const servicesDir = path.join(__dirname, '../services');

// IP cũ và IP mới
const oldIP = '192.168.1.45';
const newIP = '192.168.1.82';

// Đọc danh sách file trong thư mục
const files = fs.readdirSync(servicesDir);

// Lọc các file TypeScript
const tsFiles = files.filter(file => file.endsWith('.ts'));

console.log(`Đang cập nhật IP từ ${oldIP} thành ${newIP} trong ${tsFiles.length} file...`);

// Thay đổi IP trong từng file
let updatedFiles = 0;

tsFiles.forEach(file => {
  const filePath = path.join(servicesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Thay thế tất cả các instance của IP cũ bằng IP mới
  const newContent = content.replace(new RegExp(oldIP, 'g'), newIP);
  
  // Nếu có thay đổi, lưu file lại
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Đã cập nhật IP trong file: ${file}`);
    updatedFiles++;
  }
});

console.log(`Hoàn tất! Đã cập nhật ${updatedFiles} file.`); 