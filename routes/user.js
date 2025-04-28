const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const db = require("../config/db");
const moment = require("moment");

// Route mặc định để hiển thị thông tin cá nhân
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Định dạng ngày tạo bằng moment
    const createdAt = moment(user.created_at).format("DD/MM/YYYY");

    res.render("user/profile", {
      user: { ...user, created_at: createdAt },
      title: "Thông tin cá nhân",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Lỗi server");
  }
});

// Lấy thông tin người dùng
router.get("/info", authMiddleware, userController.getUserInfo);

// Cập nhật thông tin người dùng
router.put("/info", authMiddleware, userController.updateUserInfo);
router.post("/info", authMiddleware, userController.updateUserInfo);

// Lấy thông tin lớp học đã đăng ký và hiển thị giao diện chỉnh sửa
router.get("/classes", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [classInfo] = await db.query(
      "SELECT * FROM Classes WHERE user_id = ?",
      [userId]
    );
    const [grades] = await db.query("SELECT * FROM Grades WHERE is_active = 1");
    const [subjects] = await db.query(
      "SELECT * FROM Subjects WHERE is_active = 1"
    );

    if (!classInfo || classInfo.length === 0) {
      return res.render("user/edit_class", {
        classInfo: {},
        grades,
        subjects,
        title: "Chỉnh sửa lớp học",
        message: "Chưa có đăng ký lớp học",
      });
    }

    res.render("user/edit_class", {
      classInfo: classInfo[0],
      grades,
      subjects,
      title: "Chỉnh sửa lớp học",
      message: null,
    });
  } catch (error) {
    console.error("Error fetching class info:", error);
    res.status(500).send("Lỗi server");
  }
});

// Cập nhật thông tin lớp học
router.put("/classes", authMiddleware, userController.updateUserClass);
router.post("/classes", authMiddleware, userController.updateUserClass);

// Lấy thông tin gia sư đã đăng ký và hiển thị giao diện chỉnh sửa
router.get("/tutors", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy thông tin cơ bản của gia sư
    const [tutorInfo] = await db.query(
      "SELECT * FROM Tutors WHERE user_id = ?",
      [userId]
    );

    if (!tutorInfo || tutorInfo.length === 0) {
      const [grades] = await db.query(
        "SELECT * FROM Grades WHERE is_active = 1"
      );
      const [subjects] = await db.query(
        "SELECT * FROM Subjects WHERE is_active = 1"
      );
      return res.render("user/edit_tutor", {
        tutorInfo: {},
        grades,
        subjects,
        title: "Chỉnh sửa gia sư",
        message: "Chưa có đăng ký gia sư",
      });
    }

    // Kiểm tra tên bảng trong database
    let tutorSubjectsTable = "tutor_subjects"; // Tên mặc định là snake_case
    let tutorGradesTable = "tutor_grades"; // Tên mặc định là snake_case

    try {
      // Thử truy vấn với tên bảng snake_case trước
      const [testQuery] = await db.query(
        `SELECT * FROM ${tutorSubjectsTable} LIMIT 1`
      );
    } catch (error) {
      // Nếu không tồn tại, thử với tên bảng PascalCase
      tutorSubjectsTable = "TutorSubjects";
      tutorGradesTable = "TutorGrades";

      // Kiểm tra lại với tên PascalCase
      try {
        const [testQuery] = await db.query(
          `SELECT * FROM ${tutorSubjectsTable} LIMIT 1`
        );
      } catch (innerError) {
        console.error("Could not find tutor subjects table:", innerError);
        return res.status(500).render("error", {
          message:
            "Không thể tìm thấy bảng dữ liệu tutor_subjects hoặc TutorSubjects",
          error: innerError,
        });
      }
    }

    // Lấy thông tin về môn học đã chọn
    const [tutorSubjects] = await db.query(
      `SELECT subject_id FROM ${tutorSubjectsTable} WHERE tutor_id = ?`,
      [tutorInfo[0].id]
    );

    // Lấy thông tin về các lớp đã chọn
    const [tutorGrades] = await db.query(
      `SELECT grade_id FROM ${tutorGradesTable} WHERE tutor_id = ?`,
      [tutorInfo[0].id]
    );

    // Lấy danh sách tất cả các môn học và lớp
    const [grades] = await db.query("SELECT * FROM Grades WHERE is_active = 1");
    const [subjects] = await db.query(
      "SELECT * FROM Subjects WHERE is_active = 1"
    );

    // Chuyển đổi mảng các đối tượng thành mảng các ID
    const subjectIds = tutorSubjects.map((item) => item.subject_id);
    const gradeIds = tutorGrades.map((item) => item.grade_id);

    // Thêm thông tin về môn học và lớp vào đối tượng tutorInfo
    const tutor = {
      ...tutorInfo[0],
      subjects: subjectIds,
      grades: gradeIds,
    };

    res.render("user/edit_tutor", {
      tutorInfo: tutor,
      grades,
      subjects,
      title: "Chỉnh sửa gia sư",
      message: null,
    });
  } catch (error) {
    console.error("Error fetching tutor info:", error);
    res.status(500).render("error", {
      message: "Có lỗi xảy ra khi lấy thông tin gia sư",
      error: error,
    });
  }
});

// Cập nhật thông tin gia sư
router.put("/tutors", authMiddleware, userController.updateUserTutor);
router.post("/tutors", authMiddleware, userController.updateUserTutor);

// Route để hiển thị trang chỉnh sửa thông tin cá nhân
router.get("/edit-profile", authMiddleware, (req, res) => {
  res.render("user/edit_profile", {
    user: req.user,
    title: "Chỉnh sửa thông tin cá nhân",
  });
});

// Route để hiển thị trang đổi mật khẩu
router.get("/change-password", authMiddleware, (req, res) => {
  res.render("user/change_password", { title: "Đổi mật khẩu", user: req.user });
});

// Route để xử lý đổi mật khẩu
router.post("/change-password", authMiddleware, userController.changePassword);

module.exports = router;
