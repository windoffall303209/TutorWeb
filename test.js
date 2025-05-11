const bcrypt = require('bcrypt');

// Mật khẩu gốc
const plainPassword = 'admin'; // Thay đổi mật khẩu này theo ý bạn
const saltRounds = 10;

// Tạo mật khẩu đã mã hóa
bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Lỗi khi mã hóa mật khẩu:', err);
    return;
  }
  console.log('Mật khẩu đã mã hóa:', hash);
  // Sử dụng hash này trong câu lệnh SQL
});