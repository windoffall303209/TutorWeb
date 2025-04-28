-- Thêm các trường cần thiết cho chức năng quên mật khẩu
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expires DATETIME NULL;

-- Đảm bảo rằng bảng users có trường email (nếu chưa có)
ALTER TABLE users 
ADD COLUMN email VARCHAR(255) NULL UNIQUE;