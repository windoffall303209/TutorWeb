-- Bảng Users (đã sửa lại tên bảng và thêm cột email)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- Bảng Grades
CREATE TABLE Grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- Bảng Subjects
CREATE TABLE Subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- Bảng Classes (đã sửa lại để sử dụng foreign keys)
CREATE TABLE Classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    parent_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    specific_address VARCHAR(255),
    tutor_gender ENUM('male', 'female', 'any') NOT NULL DEFAULT 'any',
    sessions_per_week INT NOT NULL,
    fee_per_session DECIMAL(10,2) NOT NULL,
    grade_id INT NOT NULL,
    subject_id INT NOT NULL,
    description TEXT,
    status ENUM('open', 'taken') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    learning_mode ENUM('online', 'offline', 'all') NOT NULL DEFAULT 'all',
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES Grades(id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(id)
);

-- Bảng Tutors (đã sửa lại để sử dụng foreign keys)
CREATE TABLE Tutors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    birth_year INT NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    address VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    classes_teach VARCHAR(255) NOT NULL,
    subjects_teach VARCHAR(255) NOT NULL,
    education_level VARCHAR(100) NOT NULL,
    introduction TEXT,
    photo VARCHAR(255),
    phone VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng ClassTutor (bảng trung gian)
CREATE TABLE ClassTutor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    tutor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES Tutors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_tutor (class_id, tutor_id)
);

-- Bảng Chats (đã sửa lại tham chiếu từ User thành Users)
CREATE TABLE Chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Bảng Class_Register (Đăng ký nhận lớp)
CREATE TABLE Class_Register (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    tutor_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    notes TEXT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES Tutors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_tutor (class_id, tutor_id)
);

-- Bảng Class_Schedule (Lịch học)
CREATE TABLE Class_Schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    tutor_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    meeting_url VARCHAR(255),
    status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES Tutors(id) ON DELETE CASCADE
);

-- Bảng Tutor_Ratings (Đánh giá gia sư)
CREATE TABLE Tutor_Ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tutor_id) REFERENCES Tutors(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_tutor_rating (user_id, tutor_id)
);