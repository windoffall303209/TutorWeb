/**
 * Middleware ghi log các hoạt động của ứng dụng
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Đường dẫn đến file log
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'app.log');

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Các đuôi tệp tĩnh cần bỏ qua khi ghi log
const staticExtensions = ['.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];

// Kiểm tra một đường dẫn có phải là tài nguyên tĩnh hay không
const isStaticResource = (url) => {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    return staticExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.startsWith('/img/') || 
           pathname.startsWith('/css/') || 
           pathname.startsWith('/js/');
  } catch (err) {
    return false;
  }
};

// Kiểm tra xem một URL có thuộc về luồng đăng ký/đăng nhập không
const isAuthFlow = (url) => {
  if (!url) return false;
  return url.includes('/auth/') || 
         url.includes('/register') || 
         url.includes('/login') || 
         url.includes('/logout');
};

// Lưu lại các hàm gốc của console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Cờ để kiểm soát việc ghi log trùng lặp
let isLoggingToFile = false;

/**
 * Ghi log vào file
 * @param {string} message - Thông điệp cần ghi vào log
 */
const writeToLogFile = (message) => {
  // Kiểm tra nếu đang ghi log, không ghi thêm để tránh đệ quy
  if (isLoggingToFile) return;
  
  isLoggingToFile = true;
  
  try {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // Xử lý thông điệp nhiều dòng
    const lines = message.split('\n');
    let logMessage = '';
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== '') {
        logMessage += `[${timestamp}] ${lines[i]}\n`;
      }
    }
    
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    // Sử dụng hàm gốc để tránh vòng lặp vô hạn
    originalConsoleError('Không thể ghi log vào file:', err);
  } finally {
    isLoggingToFile = false;
  }
};

/**
 * Format thông tin người dùng ngắn gọn
 * @param {Object} user - Đối tượng session.user
 * @returns {string} - Chuỗi thông tin người dùng đã định dạng
 */
const formatUserInfo = (user) => {
  if (!user) return 'Guest';
  return `ID: ${user.id} - ${user.display_name || user.username} - ${user.role}`;
};

/**
 * Thêm dòng kẻ ngang để phân tách các nhóm log
 */
const addSeparator = () => {
  const separator = '=================================================';
  originalConsoleLog(separator);
  writeToLogFile(separator);
};

// Lưu trữ thông tin của request trước đó để theo dõi luồng
let lastRequestTime = 0;
let lastMethod = '';
let lastUrl = '';
// Sử dụng để theo dõi session đã log
let lastSessionLogged = null;

/**
 * Log hoạt động của ứng dụng - chỉ hiển thị URL không phải tài nguyên tĩnh
 */
const logActivity = (req, res, next) => {
  const { method, url, originalUrl } = req;
  
  // Bỏ qua tài nguyên tĩnh
  if (!isStaticResource(url)) {
    const currentTime = Date.now();
    
    // Kết thúc một hành động trước đó (đánh dấu bằng dòng kẻ ngang)
    if (shouldEndPreviousAction(method, url, currentTime)) {
      addSeparator();
      // Reset lastSessionLogged khi kết thúc một hành động
      lastSessionLogged = null;
    }
    
    // Tạo log với định dạng nhiều dòng
    let logMessage = '';
    
    // Thêm thông tin người dùng (nếu chưa logged trong chuỗi hiện tại)
    const sessionId = req.session?.id;
    const user = req.session?.user;
    
    if (user && (!lastSessionLogged || lastSessionLogged !== `${sessionId}-${user.id}`)) {
      logMessage += `SESSION: ${formatUserInfo(user)}\n`;
      lastSessionLogged = `${sessionId}-${user.id}`;
    }
    
    // Thêm thông tin URL
    logMessage += `${method}: ${originalUrl || url}`;
    
    // Ghi log vào console và file
    originalConsoleLog(logMessage);
    writeToLogFile(logMessage);
    
    // Cập nhật thông tin request trước đó
    lastRequestTime = currentTime;
    lastMethod = method;
    lastUrl = url;
  }
  
  next();
};

/**
 * Xác định xem có nên kết thúc một hành động trước đó không
 */
const shouldEndPreviousAction = (method, url, currentTime) => {
  // Nếu chưa có request nào trước đó
  if (!lastMethod || !lastUrl) {
    return false;
  }
  
  // Nếu phương thức thay đổi (GET -> POST)
  if (lastMethod !== method) {
    return true;
  }
  
  // Nếu thay đổi phần chính của URL (/user/* -> /admin/*)
  const urlPath1 = lastUrl.split('/')[1] || '';
  const urlPath2 = url.split('/')[1] || '';
  if (urlPath1 !== '' && urlPath2 !== '' && urlPath1 !== urlPath2) {
    return true;
  }
  
  // Nếu đã qua 5 giây kể từ request trước
  if (currentTime - lastRequestTime > 5000) {
    return true;
  }
  
  return false;
};

/**
 * Kiểm tra xem hai URL có liên quan đến nhau không
 */
const isRelatedUrl = (url1, url2) => {
  if (!url1 || !url2) return false;
  
  // Coi mỗi URL là một request riêng biệt
  // Chỉ xem như có liên quan nếu họ hoàn toàn giống nhau
  return url1 === url2;
};

/**
 * Log việc render trang
 */
const logRender = (req, res, next) => {
  // Lưu lại phương thức render gốc
  const originalRender = res.render;
  
  // Ghi đè phương thức render
  res.render = function(view, options, callback) {
    // Chỉ ghi log render cho các trang không phải tài nguyên tĩnh
    if (!isStaticResource(req.url)) {
      // Đối với layouts, chỉ log nếu đó là layout chính
      if (!view.includes('layouts/') || view === 'layouts/main') {
        // Log chỉ thông tin render (không lặp lại SESSION hoặc URL)
        let logMessage = `RENDER: ${view}`;
        
        // Ghi log vào console và file
        originalConsoleLog(logMessage);
        writeToLogFile(logMessage);
        
        // Thêm dòng kẻ ngang sau khi log render
        addSeparator();
        // Reset lastSessionLogged khi kết thúc một hành động
        lastSessionLogged = null;
      }
    }
    
    // Gọi phương thức render gốc
    return originalRender.call(this, view, options, callback);
  };
  
  next();
};

/**
 * Log redirect
 */
const logRedirects = (req, res, next) => {
  // Lưu lại phương thức redirect gốc
  const originalRedirect = res.redirect;
  
  // Ghi đè phương thức redirect
  res.redirect = function(status, url) {
    // Xử lý trường hợp chỉ có một tham số (url)
    if (typeof status === 'string') {
      url = status;
      status = 302;
    }
    
    // Log chỉ thông tin redirect
    let logMessage = `REDIRECT: ${req.originalUrl || req.url} -> ${url}`;
    
    // Ghi log vào console và file
    originalConsoleLog(logMessage);
    writeToLogFile(logMessage);
    
    // Thêm dòng kẻ ngang sau khi log redirect
    addSeparator();
    // Reset lastSessionLogged khi kết thúc một hành động
    lastSessionLogged = null;
    
    // Gọi phương thức redirect gốc
    return originalRedirect.call(this, status, url);
  };
  
  next();
};

/**
 * Log lỗi
 */
const logError = (err, req, res, next) => {
  // Bỏ qua lỗi với tài nguyên tĩnh
  if (!isStaticResource(req.url)) {
    // Log thông tin lỗi
    let logMessage = `ERROR: ${err.message} (${req.method}: ${req.originalUrl || req.url})`;
    
    // Ghi log vào console và file
    originalConsoleError(logMessage);
    writeToLogFile(logMessage);
    
    // Thêm dòng kẻ ngang sau khi log lỗi
    addSeparator();
    // Reset lastSessionLogged khi kết thúc một hành động
    lastSessionLogged = null;
  }
  
  next(err);
};

// Ghi đè console.log chỉ cho các log không phải từ middleware logger
console.log = function() {
  // Gọi hàm gốc để hiển thị trong console
  originalConsoleLog.apply(console, arguments);
  
  // Không cần ghi thêm vào file, vì các middleware logger đã xử lý
};

// Ghi đè console.error để mọi lỗi đều được log
console.error = function() {
  // Gọi hàm gốc để hiển thị trong console
  originalConsoleError.apply(console, arguments);
  
  // Chuyển đổi tất cả các đối số thành một chuỗi
  const args = Array.from(arguments);
  let message = args.map(arg => 
    typeof arg === 'object' && arg instanceof Error ? `${arg.name}: ${arg.message}` :
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Chỉ ghi vào file các lỗi không được xử lý bởi middleware
  if (!message.includes('ERROR:') && !isLoggingToFile) {
    writeToLogFile(`ERROR: ${message}`);
  }
};

// Ghi đè console.warn
console.warn = function() {
  // Gọi hàm gốc để hiển thị trong console
  originalConsoleWarn.apply(console, arguments);
  
  // Chuyển đổi tất cả các đối số thành một chuỗi
  const args = Array.from(arguments);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  // Ghi vào file log với prefix WARNING
  if (!isLoggingToFile) {
    writeToLogFile(`WARNING: ${message}`);
  }
};

module.exports = {
  logActivity,
  logRender,
  logRedirects,
  logError,
  writeToLogFile,
  isStaticResource,
  addSeparator,
  formatUserInfo,
  shouldEndPreviousAction
}; 