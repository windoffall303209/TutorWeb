# Ứng dụng Quản lý Gia sư

Ứng dụng web quản lý gia sư giúp kết nối phụ huynh với gia sư, tạo lớp học và quản lý lịch dạy.

## Tính năng chính

### Tìm kiếm và đăng ký lớp
- Tìm kiếm lớp học theo nhiều tiêu chí
- Phụ huynh có thể đăng lớp mới
- Gia sư có thể tìm kiếm và đăng ký dạy các lớp phù hợp

### Quản lý gia sư
- Đăng ký làm gia sư
- Xem thông tin chi tiết gia sư
- Đánh giá và bình luận về gia sư
- Xem lịch sử dạy của gia sư

### Quản lý lớp học
- Phụ huynh tạo lớp học mới
- Xét duyệt gia sư đăng ký dạy
- Quản lý thông tin lớp học

### Hệ thống nhắn tin
- Nhắn tin trực tiếp giữa phụ huynh và gia sư
- Thông báo tin nhắn mới

### Tính năng đăng ký nhận lớp
- Gia sư có thể đăng ký dạy các lớp phù hợp
- Phụ huynh xem và quản lý danh sách gia sư đăng ký
- Chấp nhận hoặc từ chối gia sư với ghi chú phản hồi

### Xếp lịch học
- Lên lịch cho các buổi học
- Hỗ trợ cả học trực tuyến và học tại nhà
- Quản lý trạng thái buổi học (đã lên lịch, hoàn thành, hủy, dời lịch)

### Đánh giá gia sư
- Phụ huynh đánh giá chất lượng gia sư
- Hiển thị điểm đánh giá trung bình và phân phối đánh giá
- Mỗi người dùng chỉ được đánh giá một gia sư một lần và có thể sửa đánh giá

## Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: EJS, Bootstrap, JavaScript
- **Realtime**: Socket.io cho tính năng chat
- **Authentication**: Sessions, Bcrypt

## Cài đặt và chạy ứng dụng

1. Clone repository
2. Cài đặt các phụ thuộc: `npm install`
3. Tạo database MySQL và import file `database.sql`
4. Cấu hình file `.env` với thông tin database
5. Chạy ứng dụng: `npm start`

## Cấu trúc thư mục

- `/controllers`: Logic xử lý các request
- `/routes`: Định nghĩa các endpoint API
- `/views`: Template EJS cho frontend
- `/public`: Static files (CSS, JS, images)
- `/config`: File cấu hình
- `/middleware`: Middleware Express

## Đóng góp

Mọi đóng góp đều được hoan nghênh. Vui lòng tạo issue hoặc pull request để đóng góp.