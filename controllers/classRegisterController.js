const dbPromise = require("../config/db");

/**
 * Controller cho chức năng đăng ký nhận lớp
 */
exports.registerForClass = async (req, res) => {
  try {
    // Kiểm tra người dùng đăng nhập
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để đăng ký nhận lớp",
      });
    }

    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    
    // Xác định classId từ request body
    let classId = null;
    
    if (req.body && req.body.classId !== undefined) {
      classId = req.body.classId;
    } else if (typeof req.body === 'string') {
      try {
        const parsedBody = JSON.parse(req.body);
        classId = parsedBody.classId;
      } catch (e) {
        console.error("Lỗi khi parse JSON body:", e);
      }
    }
    
    // Kiểm tra classId và chuyển đổi thành số nếu cần
    if (classId === undefined || classId === null) {
      return res.status(400).json({
        success: false,
        message: "ID lớp học không được cung cấp",
      });
    }
    
    // Đảm bảo classId là kiểu số
    if (typeof classId === 'string') {
      classId = parseInt(classId, 10);
      if (isNaN(classId)) {
        return res.status(400).json({
          success: false,
          message: "ID lớp học không hợp lệ, phải là số",
        });
      }
    }
    
    console.log("ClassId đã xử lý:", classId, "Kiểu:", typeof classId);
    
    const userId = req.session.user.id;
    const db = await dbPromise;

    // Kiểm tra người dùng có phải là gia sư không
    const [tutors] = await db.query(
      "SELECT id FROM tutors WHERE user_id = ?",
      [userId]
    );

    if (tutors.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Chỉ gia sư mới có thể đăng ký nhận lớp",
      });
    }

    const tutorId = tutors[0].id;

    // Kiểm tra lớp học tồn tại
    console.log(`Kiểm tra lớp học tồn tại với ID = ${classId}`);
    
    // Kiểm tra lớp có tồn tại không 
    const [classes] = await db.query(
      "SELECT * FROM classes WHERE id = ?",
      [classId]
    );
    
    console.log("Kết quả classes.length =", classes.length);
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lớp học không tồn tại (ID: " + classId + ")",
      });
    }
    
    const classInfo = classes[0];
    if (classInfo.status !== 'open') {
      return res.status(404).json({
        success: false,
        message: "Lớp học này không còn nhận đăng ký (đã có gia sư)",
      });
    }
    
    if (!classInfo.is_active) {
      return res.status(404).json({
        success: false,
        message: "Lớp học này đã bị vô hiệu hóa",
      });
    }

    // Kiểm tra gia sư có đã đăng ký lớp này chưa
    const [registrations] = await db.query(
      "SELECT * FROM class_register WHERE class_id = ? AND tutor_id = ?",
      [classId, tutorId]
    );

    if (registrations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đăng ký lớp này rồi",
      });
    }

    // Tiến hành đăng ký
    const [result] = await db.query(
      "INSERT INTO class_register (class_id, tutor_id) VALUES (?, ?)",
      [classId, tutorId]
    );

    res.status(200).json({
      success: true,
      message: "Đăng ký nhận lớp thành công! Vui lòng đợi phản hồi từ phụ huynh.",
    });
  } catch (err) {
    console.error("Lỗi khi đăng ký nhận lớp:", err);
    console.error(err.stack); // In ra stack trace đầy đủ
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký nhận lớp: " + err.message,
    });
  }
};

/**
 * Hiển thị danh sách đăng ký của gia sư
 */
exports.getTutorRegistrations = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.session.user.id;
    const db = await dbPromise;

    // Lấy id của gia sư
    const [tutors] = await db.query(
      "SELECT id FROM tutors WHERE user_id = ?",
      [userId]
    );

    if (tutors.length === 0) {
      return res.redirect("/tutors/register");
    }

    const tutorId = tutors[0].id;

    // Lấy danh sách đăng ký của gia sư và thông tin lớp học
    const [registrations] = await db.query(
      `SELECT cr.*, 
        c.parent_name, c.fee_per_session, c.sessions_per_week,
        c.district, c.province, c.learning_mode,
        s.name as subject_name, g.name as grade_name,
        u.username as parent_username
       FROM class_register cr
       JOIN classes c ON cr.class_id = c.id
       JOIN subjects s ON c.subject_id = s.id
       JOIN grades g ON c.grade_id = g.id
       JOIN users u ON c.user_id = u.id
       WHERE cr.tutor_id = ?
       ORDER BY cr.request_date DESC`,
      [tutorId]
    );

    res.render("tutor/registrations", {
      title: "Danh sách lớp đã đăng ký",
      registrations,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đăng ký:", err);
    res.status(500).send("Đã xảy ra lỗi khi lấy danh sách đăng ký.");
  }
};

/**
 * Hiển thị danh sách gia sư đăng ký lớp cho phụ huynh
 */
exports.getClassRegistrations = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const classId = req.params.classId;
    const db = await dbPromise;

    // Kiểm tra lớp có thuộc về người dùng không
    const [classes] = await db.query(
      "SELECT * FROM classes WHERE id = ? AND user_id = ?",
      [classId, req.session.user.id]
    );

    if (classes.length === 0) {
      return res.status(403).send("Bạn không có quyền xem thông tin này");
    }

    // Lấy danh sách gia sư đăng ký
    const [registrations] = await db.query(
      `SELECT cr.*, 
        t.full_name, t.gender, t.education_level, t.phone, t.photo,
        u.username,
        (SELECT ROUND(AVG(tr.rating), 1) FROM tutor_ratings tr WHERE tr.tutor_id = t.id) as average_rating,
        (SELECT COUNT(*) FROM tutor_ratings tr WHERE tr.tutor_id = t.id) as rating_count
       FROM class_register cr
       JOIN tutors t ON cr.tutor_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE cr.class_id = ?
       ORDER BY cr.request_date DESC`,
      [classId]
    );

    // Lấy thông tin môn học và lớp học
    const [classInfo] = await db.query(
      `SELECT c.*, s.name as subject_name, g.name as grade_name
       FROM classes c
       JOIN subjects s ON c.subject_id = s.id
       JOIN grades g ON c.grade_id = g.id
       WHERE c.id = ?`,
      [classId]
    );

    res.render("class/registrations", {
      title: "Danh sách gia sư đăng ký",
      registrations,
      classInfo: classInfo[0],
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách gia sư đăng ký:", err);
    res.status(500).send("Đã xảy ra lỗi khi lấy danh sách gia sư đăng ký.");
  }
};

/**
 * Xử lý phản hồi đăng ký của phụ huynh (chấp nhận hoặc từ chối gia sư)
 */
exports.respondToRegistration = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để thực hiện chức năng này",
      });
    }

    const { registrationId, status, notes } = req.body;
    const userId = req.session.user.id;
    const db = await dbPromise;

    // Kiểm tra đăng ký tồn tại
    const [registrations] = await db.query(
      `SELECT cr.*, c.user_id as class_owner_id, c.status as class_status
       FROM class_register cr
       JOIN classes c ON cr.class_id = c.id
       WHERE cr.id = ?`,
      [registrationId]
    );

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin đăng ký",
      });
    }

    const registration = registrations[0];

    // Kiểm tra người dùng có phải chủ lớp học
    if (registration.class_owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện chức năng này",
      });
    }

    // Kiểm tra lớp còn mở không
    if (registration.class_status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Lớp học đã được nhận bởi gia sư khác",
      });
    }

    // Cập nhật trạng thái đăng ký
    await db.query(
      `UPDATE class_register 
       SET status = ?, notes = ?, response_date = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, notes || null, registrationId]
    );

    // Nếu chấp nhận, cập nhật trạng thái lớp thành "taken"
    if (status === "accepted") {
      await db.query(
        "UPDATE classes SET status = 'taken' WHERE id = ?",
        [registration.class_id]
      );

      // Từ chối tất cả đăng ký khác cho lớp này
      await db.query(
        `UPDATE class_register 
         SET status = 'rejected', notes = 'Lớp học đã được nhận bởi gia sư khác', response_date = CURRENT_TIMESTAMP
         WHERE class_id = ? AND id != ? AND status = 'pending'`,
        [registration.class_id, registrationId]
      );
    }

    res.status(200).json({
      success: true,
      message: status === "accepted" 
        ? "Đã chấp nhận gia sư đăng ký" 
        : "Đã từ chối gia sư đăng ký",
    });
  } catch (err) {
    console.error("Lỗi khi xử lý đăng ký:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý đăng ký",
    });
  }
}; 