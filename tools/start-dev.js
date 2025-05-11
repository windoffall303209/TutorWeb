/**
 * Script khởi động để chạy ứng dụng và log viewer cùng một lúc
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Đảm bảo thư mục logs tồn tại
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

console.log(`${colors.green}Khởi động ứng dụng và log viewer...${colors.reset}`);

// Tạo cửa sổ terminal mới để chạy log viewer
let logViewerProcess;
if (process.platform === 'win32') {
  // Trên Windows, sử dụng PowerShell để mở cửa sổ mới
  logViewerProcess = spawn('powershell', [
    '-Command',
    `Start-Process powershell -ArgumentList '-NoExit -Command "cd ${path.resolve(__dirname, '..')}; node tools/log-viewer.js"'`,
  ]);
} else {
  // Trên Unix/Linux/Mac, sử dụng gnome-terminal, xterm, hoặc terminal tương tự
  try {
    logViewerProcess = spawn('gnome-terminal', [
      '--',
      'bash',
      '-c',
      `cd ${path.resolve(__dirname, '..')} && node tools/log-viewer.js; exec bash`,
    ]);
  } catch (error) {
    try {
      logViewerProcess = spawn('xterm', [
        '-e',
        `cd ${path.resolve(__dirname, '..')} && node tools/log-viewer.js; exec bash`,
      ]);
    } catch (err) {
      console.log(`${colors.red}Không thể mở cửa sổ terminal mới cho log viewer${colors.reset}`);
      console.log(`${colors.yellow}Vui lòng mở terminal mới và chạy: npm run log-viewer${colors.reset}`);
    }
  }
}

// Chạy ứng dụng web với chế độ debug
const appProcess = spawn('node', ['app.js'], {
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'inherit',
});

console.log(`${colors.green}Ứng dụng đã được khởi động${colors.reset}`);

// Xử lý khi quá trình kết thúc
appProcess.on('close', (code) => {
  console.log(`${colors.yellow}Ứng dụng đã dừng với mã thoát: ${code}${colors.reset}`);
  
  // Đảm bảo cả log viewer cũng dừng lại (nếu là tiến trình con)
  if (logViewerProcess && !logViewerProcess.killed) {
    logViewerProcess.kill();
  }
  
  process.exit(code);
});

// Xử lý tín hiệu tắt
process.on('SIGINT', () => {
  console.log(`${colors.yellow}Nhận được tín hiệu SIGINT, đang dừng ứng dụng...${colors.reset}`);
  
  if (appProcess && !appProcess.killed) {
    appProcess.kill();
  }
  
  if (logViewerProcess && !logViewerProcess.killed) {
    logViewerProcess.kill();
  }
  
  process.exit(0);
}); 