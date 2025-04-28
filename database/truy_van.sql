CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) not NULL;
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE Subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE Grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);
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
    subject_id INT NOT NULL,
    grade_id INT NOT NULL,
    description TEXT,
    status ENUM('open', 'taken') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    learning_mode ENUM('online', 'offline', 'all') NOT NULL DEFAULT 'all',
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES Grades(id) ON DELETE RESTRICT
);
CREATE TABLE Tutors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    birth_year INT NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    address VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    education_level VARCHAR(100) NOT NULL,
    introduction TEXT,
    photo VARCHAR(255),
    phone VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);
CREATE TABLE Tutor_Subjects (
    tutor_id INT NOT NULL,
    subject_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_id, subject_id),
    FOREIGN KEY (tutor_id) REFERENCES Tutors(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(id) ON DELETE CASCADE
);
CREATE TABLE Tutor_Grades (
    tutor_id INT NOT NULL,
    grade_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_id, grade_id),
    FOREIGN KEY (tutor_id) REFERENCES Tutors(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES Grades(id) ON DELETE CASCADE
);