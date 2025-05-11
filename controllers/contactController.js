const dbPromise = require("../config/db");

exports.getContactPage = async (req, res) => {
  try {
    // Lấy danh sách môn học và khối lớp từ database
    const [subjects] = await dbPromise.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );
    const [grades] = await dbPromise.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );

    res.render("contact/index", {
      title: "Liên hệ",
      user: req.user,
      subjects: subjects,
      grades: grades,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error("Error getting contact page:", error);
    res.status(500).render("error", {
      message: "Đã có lỗi xảy ra khi tải trang liên hệ",
    });
  }
};

exports.showForm = async (req, res) => {
  try {
    // Lấy danh sách môn học và khối lớp
    const [subjects] = await dbPromise.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );
    const [grades] = await dbPromise.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );

    res.render("contact/index", {
      title: "Đăng ký",
      formType: req.query.type || "tutor",
      subjects,
      grades,
      user: req.session.user,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error("Error in showForm:", error);
    res.status(500).send("Internal Server Error");
  }
};
