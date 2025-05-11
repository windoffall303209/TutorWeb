const dbPromise = require("../config/db");
const Tutor = require("../models/tutor");
const Subject = require("../models/subject");
const Grade = require("../models/grade");

exports.getTutors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    // Tạo đối tượng filters từ query params
    const filters = {
      subjects_teach: req.query.subjects_teach,
      classes_teach: req.query.classes_teach,
      gender: req.query.gender,
      education_level: req.query.education_level,
      district: req.query.district,
    };

    // Lấy tổng số gia sư thỏa mãn điều kiện tìm kiếm
    const totalCount = await Tutor.getSearchCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    // Lấy danh sách gia sư theo bộ lọc
    const tutors = await Tutor.search(filters, limit, offset);

    // Lấy danh sách môn học và khối lớp
    const [subjects] = await dbPromise.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );
    const [grades] = await dbPromise.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );

    // Lấy danh sách quận/huyện từ các gia sư
    const [districts] = await dbPromise.query(
      "SELECT DISTINCT district FROM tutors WHERE district IS NOT NULL AND district != ''"
    );

    res.render("tutors/list", {
      title: "Danh sách gia sư",
      tutors,
      currentPage: page,
      totalPages,
      subjects,
      grades,
      districts,
      query: req.query,
    });
  } catch (error) {
    console.error("Error in getTutors:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getTutorDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const tutor = await Tutor.getById(id);
    if (!tutor) {
      return res.status(404).send("Tutor not found");
    }
    res.render("tutors/detail", {
      title: "Chi tiết gia sư",
      tutor,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error in getTutorDetail:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.registerTutor = async (req, res) => {
  try {
    const {
      full_name,
      birth_year,
      gender,
      address,
      district,
      province,
      phone,
      education_level,
      introduction,
      subjectIds,
      gradeIds,
    } = req.body;

    // Lấy danh sách môn học và khối lớp để có sẵn cho form
    const [subjects] = await dbPromise.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );
    const [grades] = await dbPromise.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );

    // Kiểm tra các trường bắt buộc
    if (
      !full_name ||
      !birth_year ||
      !gender ||
      !address ||
      !district ||
      !province ||
      !phone ||
      !education_level ||
      !introduction ||
      !subjectIds ||
      !gradeIds
    ) {
      return res.render("contact/index", {
        title: "Đăng ký gia sư",
        user: req.session.user,
        error: "Vui lòng điền đầy đủ thông tin.",
        formData: req.body,
        subjects,
        grades,
        formType: "tutor"
      });
    }

    // Kiểm tra xem người dùng đã đăng ký làm gia sư chưa
    const db = await dbPromise;
    const [existingTutor] = await db.query(
      "SELECT * FROM tutors WHERE user_id = ?",
      [req.session.user.id]
    );

    if (existingTutor.length > 0) {
      console.log("Người dùng đã đăng ký làm gia sư trước đó.");
      return res.render("registration_result", {
        title: "Đăng ký gia sư",
        success: false,
        message: "Bạn đã đăng ký làm gia sư trước đó.",
        backUrl: "/contact",
        user: req.session.user
      });
    }

    // Xử lý file ảnh
    let photoName = null;
    if (req.file) {
      const fileExtension = req.file.originalname.split(".").pop();
      const newFileName = `${req.file.filename}.${fileExtension}`;
      const fs = require("fs");
      const oldPath = `public/uploads/${req.file.filename}`;
      const newPath = `public/uploads/${newFileName}`;

      // Đổi tên file để thêm phần mở rộng
      fs.renameSync(oldPath, newPath);
      photoName = newFileName;
    }

    const tutorData = {
      user_id: req.session.user.id,
      full_name,
      birth_year,
      gender,
      address,
      district,
      province,
      phone,
      education_level,
      introduction,
      photo: photoName,
    };

    const newTutor = await Tutor.create(tutorData, subjectIds, gradeIds);
    console.log("Đăng ký gia sư thành công:", newTutor);
    
    // Trả về trang kết quả với thông báo thành công
    return res.render("registration_result", {
      title: "Đăng ký gia sư",
      success: true,
      message: "Bạn đã đăng ký làm gia sư thành công. Hồ sơ của bạn đã được ghi nhận vào hệ thống.",
      backUrl: "/classes",
      user: req.session.user
    });
  } catch (error) {
    console.error("Error in registerTutor:", error);
    
    // Trả về trang kết quả với thông báo lỗi
    return res.render("registration_result", {
      title: "Đăng ký gia sư",
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký làm gia sư. Vui lòng thử lại sau.",
      backUrl: "/contact",
      user: req.session.user
    });
  }
};
