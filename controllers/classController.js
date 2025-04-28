const dbPromise = require("../config/db");
const Class = require("../models/class");
const Subject = require("../models/subject");
const Grade = require("../models/grade");

exports.getClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    // Tạo đối tượng filters từ query params
    const filters = {
      subject_id: req.query.subject_id,
      grade_id: req.query.grade_id,
      learning_mode: req.query.learning_mode,
      district: req.query.district,
    };

    // Lấy tổng số lớp học thỏa mãn điều kiện tìm kiếm
    const totalCount = await Class.getSearchCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    // Lấy danh sách lớp theo bộ lọc
    const classes = await Class.search(filters, limit, offset);

    // Lấy danh sách môn học và khối lớp
    const [subjects] = await dbPromise.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );
    const [grades] = await dbPromise.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );

    // Lấy danh sách quận/huyện từ các lớp học
    const [districts] = await dbPromise.query(
      "SELECT DISTINCT district FROM classes WHERE status = 'open' AND is_active = 1 AND district IS NOT NULL AND district != ''"
    );

    res.render("classes/list", {
      title: "Danh sách lớp học",
      classes,
      currentPage: page,
      totalPages,
      subjects,
      grades,
      districts,
      query: req.query,
    });
  } catch (error) {
    console.error("Error in getClasses:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getClassDetail = async (req, res) => {
  const id = req.params.id;
  try {
    const classObj = await Class.getById(id);
    if (!classObj) return res.status(404).send("Lớp học không tồn tại");

    res.render("classes/detail", {
      title: "Chi tiết lớp học",
      classObj,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.registerClass = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  try {
    const {
      parent_name,
      phone,
      district,
      province,
      specific_address,
      subject_id,
      grade_id,
      tutor_gender,
      sessions_per_week,
      fee_per_session,
      description,
      learning_mode,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (
      !parent_name ||
      !phone ||
      !district ||
      !province ||
      !specific_address ||
      !subject_id ||
      !grade_id ||
      !tutor_gender ||
      !sessions_per_week ||
      !fee_per_session ||
      !description ||
      !learning_mode
    ) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    const db = await dbPromise;

    // Kiểm tra xem người dùng đã tạo lớp học chưa
    const [existingClass] = await db.query(
      "SELECT * FROM classes WHERE user_id = ?",
      [req.session.user.id]
    );

    if (existingClass.length > 0) {
      return res.render("contact/index", {
        title: "Đăng ký lớp học",
        user: req.session.user,
        error: "Bạn đã đăng ký lớp học. Vui lòng quay lại trang trước.",
        formType: "class",
      });
    }

    const classData = {
      user_id: req.session.user.id,
      parent_name,
      phone,
      district,
      province,
      specific_address,
      subject_id,
      grade_id,
      tutor_gender,
      sessions_per_week,
      fee_per_session,
      description,
      learning_mode,
      status: "open",
    };

    const newClass = await Class.create(classData);
    res.redirect("/classes");
  } catch (error) {
    console.error("Error in registerClass:", error);
    res.status(500).send("Internal Server Error");
  }
};
