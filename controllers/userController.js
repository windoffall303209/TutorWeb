const db = require("../config/db");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

// Lấy thông tin người dùng
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.query("SELECT * FROM Users WHERE id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error });
  }
};

// Cải thiện phương thức cập nhật thông tin người dùng
exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    // Kiểm tra username đã tồn tại chưa (nếu thay đổi)
    if (username !== req.user.username) {
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE username = ? AND id != ?",
        [username, userId]
      );

      if (existingUsers.length > 0) {
        return res.render("user/edit_profile", {
          title: "Chỉnh sửa thông tin cá nhân",
          user: { ...req.user, ...req.body },
          message: "Tên đăng nhập đã tồn tại",
          messageType: "danger",
        });
      }
    }

    // Cập nhật thông tin
    await db.query("UPDATE users SET username = ?, email = ? WHERE id = ?", [
      username,
      email,
      userId,
    ]);

    // Lấy thông tin user mới
    const [updatedUsers] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (updatedUsers.length === 0) {
      return res.status(404).send("Không tìm thấy thông tin người dùng");
    }

    // Cập nhật thông tin trong session
    req.user = updatedUsers[0];

    return res.render("user/profile", {
      title: "Thông tin cá nhân",
      user: updatedUsers[0],
      message: "Cập nhật thông tin thành công",
      messageType: "success",
    });
  } catch (error) {
    console.error("Error updating user info:", error);
    return res.render("user/edit_profile", {
      title: "Chỉnh sửa thông tin cá nhân",
      user: { ...req.user, ...req.body },
      message: "Có lỗi xảy ra khi cập nhật thông tin, vui lòng thử lại sau",
      messageType: "danger",
    });
  }
};

// Cập nhật thông tin lớp học
exports.updateUserClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      classId,
      parent_name,
      phone,
      district,
      province,
      specific_address,
      tutor_gender,
      sessions_per_week,
      fee_per_session,
      subject_id,
      grade_id,
      description,
      learning_mode,
    } = req.body;

    // Khởi tạo đối tượng lỗi
    const errors = {};

    // Validate các trường
    if (!parent_name) errors.parent_name = "Vui lòng nhập tên phụ huynh";
    if (!phone) errors.phone = "Vui lòng nhập số điện thoại";
    if (!district) errors.district = "Vui lòng nhập quận/huyện";
    if (!province) errors.province = "Vui lòng nhập tỉnh/thành phố";
    if (!specific_address)
      errors.specific_address = "Vui lòng nhập địa chỉ cụ thể";
    if (!subject_id) errors.subject_id = "Vui lòng chọn môn học";
    if (!grade_id) errors.grade_id = "Vui lòng chọn khối lớp";
    if (!sessions_per_week)
      errors.sessions_per_week = "Vui lòng nhập số buổi học mỗi tuần";
    if (!fee_per_session)
      errors.fee_per_session = "Vui lòng nhập học phí mỗi buổi";
    if (!description) errors.description = "Vui lòng nhập mô tả";

    // Kiểm tra xem có lỗi nào không
    const hasErrors = Object.keys(errors).length > 0;

    // Nếu có lỗi, trả về form với thông báo lỗi
    if (hasErrors || !classId) {
      // Lấy danh sách môn học và khối lớp để render lại form
      const [grades] = await db.query(
        "SELECT * FROM grades WHERE is_active = 1"
      );
      const [subjects] = await db.query(
        "SELECT * FROM subjects WHERE is_active = 1"
      );

      return res.render("user/edit_class", {
        title: "Chỉnh sửa lớp học",
        message: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        classInfo: req.body,
        errors: errors,
        grades,
        subjects,
      });
    }

    // Kiểm tra xem lớp học có thuộc về người dùng không
    const [existingClass] = await db.query(
      "SELECT * FROM Classes WHERE id = ? AND user_id = ?",
      [classId, userId]
    );

    if (!existingClass || existingClass.length === 0) {
      // Lấy danh sách môn học và khối lớp để render lại form
      const [grades] = await db.query(
        "SELECT * FROM grades WHERE is_active = 1"
      );
      const [subjects] = await db.query(
        "SELECT * FROM subjects WHERE is_active = 1"
      );

      return res.render("user/edit_class", {
        title: "Chỉnh sửa lớp học",
        message: "Bạn không có quyền chỉnh sửa lớp học này.",
        classInfo: req.body,
        grades,
        subjects,
      });
    }

    // Cập nhật thông tin lớp học
    await db.query(
      `UPDATE Classes SET 
        parent_name = ?, 
        phone = ?, 
        district = ?, 
        province = ?, 
        specific_address = ?, 
        tutor_gender = ?, 
        sessions_per_week = ?, 
        fee_per_session = ?, 
        subject_id = ?, 
        grade_id = ?, 
        description = ?,
        learning_mode = ?
      WHERE id = ? AND user_id = ?`,
      [
        parent_name,
        phone,
        district,
        province,
        specific_address,
        tutor_gender,
        sessions_per_week,
        fee_per_session,
        subject_id,
        grade_id,
        description,
        learning_mode || "all",
        classId,
        userId,
      ]
    );

    // Chuyển hướng về trang thông tin cá nhân với thông báo thành công
    return res.redirect("/user?message=Cập nhật lớp học thành công");
  } catch (error) {
    console.error("Error updating class:", error);

    // Lấy danh sách môn học và khối lớp để render lại form
    const [grades] = await db.query("SELECT * FROM grades WHERE is_active = 1");
    const [subjects] = await db.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );

    res.status(500).render("user/edit_class", {
      title: "Chỉnh sửa lớp học",
      message:
        "Có lỗi xảy ra khi cập nhật thông tin lớp học. Vui lòng thử lại sau.",
      classInfo: req.body,
      grades,
      subjects,
    });
  }
};

// Cập nhật thông tin gia sư
exports.updateUserTutor = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tutorId,
      full_name,
      birth_year,
      gender,
      address,
      district,
      province,
      subjects,
      grades,
      introduction,
      phone,
    } = req.body;

    // Khởi tạo đối tượng lỗi
    const errors = {};

    // Validate các trường
    if (!full_name) errors.full_name = "Vui lòng nhập họ và tên";
    if (!birth_year) errors.birth_year = "Vui lòng nhập năm sinh";
    if (!gender) errors.gender = "Vui lòng chọn giới tính";
    if (!address) errors.address = "Vui lòng nhập địa chỉ";
    if (!district) errors.district = "Vui lòng nhập quận/huyện";
    if (!province) errors.province = "Vui lòng nhập tỉnh/thành phố";
    if (!phone) errors.phone = "Vui lòng nhập số điện thoại";
    if (!introduction)
      errors.introduction = "Vui lòng nhập nội dung giới thiệu";

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      errors.subjects = "Vui lòng chọn ít nhất một môn học";
    }

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      errors.grades = "Vui lòng chọn ít nhất một lớp học";
    }

    // Kiểm tra xem có lỗi nào không
    const hasErrors = Object.keys(errors).length > 0;

    // Nếu có lỗi, trả về form với thông báo lỗi
    if (hasErrors || !tutorId) {
      // Lấy danh sách môn học và khối lớp để render lại form
      const [gradesData] = await db.query(
        "SELECT * FROM grades WHERE is_active = 1"
      );
      const [subjectsData] = await db.query(
        "SELECT * FROM subjects WHERE is_active = 1"
      );

      return res.render("user/edit_tutor", {
        title: "Chỉnh sửa gia sư",
        message: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        tutorInfo: req.body,
        errors: errors,
        grades: gradesData,
        subjects: subjectsData,
      });
    }

    // Kiểm tra xem gia sư có thuộc về người dùng không
    const [existingTutor] = await db.query(
      "SELECT * FROM Tutors WHERE id = ? AND user_id = ?",
      [tutorId, userId]
    );

    if (!existingTutor || existingTutor.length === 0) {
      // Lấy danh sách môn học và khối lớp để render lại form
      const [gradesData] = await db.query(
        "SELECT * FROM grades WHERE is_active = 1"
      );
      const [subjectsData] = await db.query(
        "SELECT * FROM subjects WHERE is_active = 1"
      );

      return res.render("user/edit_tutor", {
        title: "Chỉnh sửa gia sư",
        message: "Bạn không có quyền chỉnh sửa thông tin gia sư này.",
        tutorInfo: req.body,
        grades: gradesData,
        subjects: subjectsData,
      });
    }

    // Xử lý ảnh mới nếu được upload
    let photoUpdate = "";
    let photoParams = [];

    if (req.file) {
      const photoName = req.file.filename;
      photoUpdate = ", photo = ?";
      photoParams.push(photoName);

      // Xóa ảnh cũ nếu có
      if (existingTutor[0].photo) {
        const oldPhotoPath = path.join(
          __dirname,
          "../public/uploads/",
          existingTutor[0].photo
        );
        // Kiểm tra file tồn tại trước khi xóa
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }

    // Cập nhật thông tin gia sư
    await db.query(
      `UPDATE Tutors SET 
        full_name = ?, 
        birth_year = ?, 
        gender = ?, 
        address = ?,
        district = ?,
        province = ?, 
        introduction = ?, 
        phone = ?
        ${photoUpdate}
      WHERE id = ? AND user_id = ?`,
      [
        full_name,
        birth_year,
        gender,
        address,
        district,
        province,
        introduction,
        phone,
        ...photoParams,
        tutorId,
        userId,
      ]
    );

    try {
      // Xác định tên bảng đúng trong cơ sở dữ liệu
      let tutorSubjectsTable = "tutor_subjects"; // Tên mặc định là snake_case
      let tutorGradesTable = "tutor_grades"; // Tên mặc định là snake_case

      try {
        // Thử truy vấn với tên bảng snake_case trước
        await db.query(`SELECT 1 FROM ${tutorSubjectsTable} LIMIT 1`);
      } catch (error) {
        // Nếu không tồn tại, thử với tên bảng PascalCase
        tutorSubjectsTable = "TutorSubjects";
        tutorGradesTable = "TutorGrades";
      }

      // Cập nhật môn học
      await db.query(`DELETE FROM ${tutorSubjectsTable} WHERE tutor_id = ?`, [
        tutorId,
      ]);
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        const subjectValues = subjects.map((subjectId) => [tutorId, subjectId]);
        await db.query(
          `INSERT INTO ${tutorSubjectsTable} (tutor_id, subject_id) VALUES ?`,
          [subjectValues]
        );
      }

      // Cập nhật khối lớp
      await db.query(`DELETE FROM ${tutorGradesTable} WHERE tutor_id = ?`, [
        tutorId,
      ]);
      if (grades && Array.isArray(grades) && grades.length > 0) {
        const gradeValues = grades.map((gradeId) => [tutorId, gradeId]);
        await db.query(
          `INSERT INTO ${tutorGradesTable} (tutor_id, grade_id) VALUES ?`,
          [gradeValues]
        );
      }
    } catch (error) {
      console.error("Error updating tutor subjects/grades:", error);
      // Tiếp tục xử lý ngay cả khi có lỗi với subjects/grades
    }

    // Chuyển hướng về trang thông tin cá nhân với thông báo thành công
    return res.redirect(
      "/user?message=Cập nhật thông tin gia sư thành công&messageType=success"
    );
  } catch (error) {
    console.error("Error updating tutor:", error);

    // Lấy danh sách môn học và khối lớp để render lại form
    const [gradesData] = await db.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );
    const [subjectsData] = await db.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );

    res.status(500).render("user/edit_tutor", {
      title: "Chỉnh sửa gia sư",
      message:
        "Có lỗi xảy ra khi cập nhật thông tin gia sư. Vui lòng thử lại sau.",
      tutorInfo: req.body,
      grades: gradesData,
      subjects: subjectsData,
    });
  }
};

// Lấy danh sách lớp học đã đăng ký
exports.getUserClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const classes = await db.query("SELECT * FROM Classes WHERE user_id = ?", [
      userId,
    ]);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error });
  }
};

// Lấy danh sách gia sư đã đăng ký
exports.getUserTutors = async (req, res) => {
  try {
    const userId = req.user.id;
    const tutors = await db.query("SELECT * FROM Tutors WHERE user_id = ?", [
      userId,
    ]);
    res.json(tutors);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server.", error });
  }
};

// Xử lý đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      return res.render("user/change_password", {
        title: "Đổi mật khẩu",
        message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        messageType: "danger",
      });
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      return res.render("user/change_password", {
        title: "Đổi mật khẩu",
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        messageType: "danger",
      });
    }

    // Lấy thông tin người dùng hiện tại
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res.status(404).render("user/change_password", {
        title: "Đổi mật khẩu",
        message: "Không tìm thấy thông tin người dùng",
        messageType: "danger",
      });
    }

    const user = users[0];

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.render("user/change_password", {
        title: "Đổi mật khẩu",
        message: "Mật khẩu hiện tại không đúng",
        messageType: "danger",
      });
    }

    // Mã hóa mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedNewPassword,
      userId,
    ]);

    return res.render("user/profile", {
      title: "Thông tin cá nhân",
      user: req.user,
      message: "Đổi mật khẩu thành công",
      messageType: "success",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.render("user/change_password", {
      title: "Đổi mật khẩu",
      message: "Có lỗi xảy ra khi đổi mật khẩu, vui lòng thử lại sau",
      messageType: "danger",
    });
  }
};
