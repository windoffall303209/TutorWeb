/**
 * Công cụ theo dõi log theo thời gian thực - Hiển thị tối giản
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Đường dẫn đến file log
const logFile = path.join(__dirname, '../logs/app.log');

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Kiểm tra xem file log có tồn tại không
if (!fs.existsSync(logFile)) {
  console.log(`${colors.red}File log không tồn tại: ${logFile}${colors.reset}`);
  console.log(`${colors.yellow}Vui lòng chạy ứng dụng trước để tạo file log${colors.reset}`);
  process.exit(1);
}

// Theo dõi file log
console.log(`${colors.green}==== THEO DÕI URL REQUEST =====${colors.reset}`);
console.log(`${colors.cyan}Nhấn Ctrl+C để thoát${colors.reset}`);
console.log('---------------------------------------');

// Tạo hàm clear terminal cross-platform
const clearScreen = () => {
  process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H');
};

// Theo dõi file log theo thời gian thực
const tail = fs.createReadStream(logFile, {
  encoding: 'utf8',
});

tail.on('data', (data) => {
  // Xử lý dữ liệu log
  const lines = data.toString().split('\n');
  
  lines.forEach(line => {
    if (!line.trim()) return;
    
    // Hiển thị dòng kẻ ngang
    if (line.includes('----------------------')) {
      console.log(`${colors.cyan}${line}${colors.reset}`);
      return;
    }
    
    // Tô màu cho các loại log khác nhau
    if (line.includes('[URL]')) {
      console.log(`${colors.green}${line}${colors.reset}`);
    } else if (line.includes('[RENDER]')) {
      // Hiển thị tất cả các render ngoại trừ layouts
      if (!line.includes('layouts/') || line.includes('layouts/main')) {
        console.log(`${colors.blue}${line}${colors.reset}`);
      }
    } else if (line.includes('[REDIRECT]')) {
      // Hiển thị thông tin chuyển hướng
      console.log(`${colors.magenta}${line}${colors.reset}`);
    } else if (line.includes('[ERROR]')) {
      console.log(`${colors.red}${colors.bright}${line}${colors.reset}`);
    }
    // Bỏ qua [TIME] và các loại log khác
  });
});

// Mở rộng: Thêm tính năng lọc log
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (input) => {
  if (input.startsWith('filter:')) {
    const filter = input.substring(7).trim();
    console.log(`${colors.cyan}Đã bật bộ lọc: ${filter}${colors.reset}`);
    
    // Đọc lại file log và chỉ hiển thị các dòng khớp với bộ lọc
    fs.readFile(logFile, 'utf8', (err, data) => {
      if (err) {
        console.log(`${colors.red}Lỗi khi đọc file log: ${err.message}${colors.reset}`);
        return;
      }
      
      const lines = data.toString().split('\n');
      const filteredLines = lines.filter(line => line.includes(filter));
      
      console.log(`${colors.yellow}Kết quả lọc (${filteredLines.length} dòng):${colors.reset}`);
      filteredLines.forEach(line => console.log(line));
    });
  } else if (input === 'help') {
    console.log(`${colors.cyan}Các lệnh có sẵn:${colors.reset}`);
    console.log(`  filter:<chuỗi> - Lọc log theo chuỗi`);
    console.log(`  clear - Xóa màn hình`);
    console.log(`  help - Hiển thị trợ giúp`);
    console.log(`  exit - Thoát chương trình`);
  } else if (input === 'clear') {
    clearScreen();
    console.log(`${colors.green}==== THEO DÕI URL REQUEST =====${colors.reset}`);
    console.log(`${colors.cyan}Nhấn Ctrl+C để thoát${colors.reset}`);
    console.log('---------------------------------------');
  } else if (input === 'exit') {
    process.exit(0);
  }
}); 