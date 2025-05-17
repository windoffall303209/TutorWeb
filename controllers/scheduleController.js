const dbPromise = require("../config/db");
const moment = require("moment");

/**
 * Hiển thị form tạo lịch học mới
 */
exports.getCreateScheduleForm = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const classId = req.params.classId;
    const db = await dbPromise;

    // Lấy thông tin lớp học
    const [classes] = await db.query(
      `SELECT c.*, s.name as subject_name, g.name as grade_name,
        t.id as tutor_id, t.full_name as tutor_name
       FROM Classes c
       JOIN Subjects s ON c.subject_id = s.id
       JOIN Grades g ON c.grade_id = g.id
       LEFT JOIN Class_Register cr ON c.id = cr.class_id AND cr.status = 'accepted'
       LEFT JOIN Tutors t ON cr.tutor_id = t.id
       WHERE c.id = ?`,
      [classId]
    );

    if (classes.length === 0) {
      return res.status(404).send("Không tìm thấy thông tin lớp học");
    }

    const classInfo = classes[0];

    // Kiểm tra người dùng có quyền quản lý lớp này không
    if (classInfo.user_id !== req.session.user.id && 
        (!classInfo.tutor_id || classInfo.tutor_user_id !== req.session.user.id)) {
      return res.status(403).send("Bạn không có quyền thực hiện chức năng này");
    }

    // Lấy danh sách lịch học đã tạo
    const [schedules] = await db.query(
      `SELECT * FROM Class_Schedule 
       WHERE class_id = ? 
       ORDER BY session_date ASC, start_time ASC`,
      [classId]
    );

    res.render("schedule/create", {
      title: "Xếp lịch học",
      classInfo,
      schedules,
      moment
    });
  } catch (err) {
    console.error("Lỗi khi hiển thị form tạo lịch học:", err);
    res.status(500).send("Đã xảy ra lỗi khi tải form tạo lịch học");
  }
};

/**
 * Xử lý tạo lịch học mới
 */
exports.createSchedule = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để thực hiện chức năng này"
      });
    }

    const { 
      classId, tutorId, sessionDate, startTime, endTime,
      location, meetingUrl, notes 
    } = req.body;
    
    const db = await dbPromise;

    // Kiểm tra lớp học có tồn tại không và người dùng có quyền không
    const [classes] = await db.query(
      `SELECT c.*, 
        (SELECT tr.tutor_id FROM Class_Register tr WHERE tr.class_id = c.id AND tr.status = 'accepted') as accepted_tutor_id,
        (SELECT t.user_id FROM Class_Register tr JOIN Tutors t ON tr.tutor_id = t.id 
         WHERE tr.class_id = c.id AND tr.status = 'accepted') as tutor_user_id
       FROM Classes c
       WHERE c.id = ?`,
      [classId]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin lớp học"
      });
    }

    const classInfo = classes[0];

    // Kiểm tra người dùng có quyền quản lý lớp này không
    if (classInfo.user_id !== req.session.user.id && 
        (!classInfo.tutor_user_id || classInfo.tutor_user_id !== req.session.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện chức năng này"
      });
    }

    // Kiểm tra ngày và giờ hợp lệ
    const currentDate = new Date();
    const selectedDate = new Date(sessionDate);
    
    if (selectedDate < currentDate && selectedDate.toDateString() !== currentDate.toDateString()) {
      return res.status(400).json({
        success: false,
        message: "Không thể tạo lịch học cho ngày trong quá khứ"
      });
    }

    // Kiểm tra thời gian bắt đầu và kết thúc
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "Thời gian kết thúc phải sau thời gian bắt đầu"
      });
    }

    // Nếu là học online, cần có link meeting
    if (classInfo.learning_mode === 'online' && !meetingUrl) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp đường dẫn học trực tuyến cho lớp online"
      });
    }

    // Nếu là học offline, cần có địa điểm
    if (classInfo.learning_mode === 'offline' && !location) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp địa điểm học cho lớp offline"
      });
    }

    // Tạo lịch học mới
    await db.query(
      `INSERT INTO Class_Schedule 
        (class_id, tutor_id, session_date, start_time, end_time, 
         location, meeting_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classId, 
        tutorId || classInfo.accepted_tutor_id, 
        sessionDate, 
        startTime, 
        endTime, 
        location || null, 
        meetingUrl || null, 
        notes || null
      ]
    );

    res.status(200).json({
      success: true,
      message: "Đã tạo lịch học thành công"
    });
  } catch (err) {
    console.error("Lỗi khi tạo lịch học:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tạo lịch học"
    });
  }
};

/**
 * Cập nhật trạng thái lịch học
 */
exports.updateScheduleStatus = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để thực hiện chức năng này"
      });
    }

    const { scheduleId, status, notes } = req.body;
    const userId = req.session.user.id;
    const db = await dbPromise;

    // Kiểm tra lịch học có tồn tại không
    const [schedules] = await db.query(
      `SELECT cs.*, c.user_id as class_owner_id, t.user_id as tutor_user_id
       FROM Class_Schedule cs
       JOIN Classes c ON cs.class_id = c.id
       LEFT JOIN Tutors t ON cs.tutor_id = t.id
       WHERE cs.id = ?`,
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin lịch học"
      });
    }

    const schedule = schedules[0];

    // Kiểm tra người dùng có quyền quản lý lịch học này không
    if (schedule.class_owner_id !== userId && schedule.tutor_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện chức năng này"
      });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ"
      });
    }

    // Cập nhật trạng thái lịch học
    await db.query(
      `UPDATE Class_Schedule 
       SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, notes || schedule.notes, scheduleId]
    );

    res.status(200).json({
      success: true,
      message: "Đã cập nhật trạng thái lịch học thành công"
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái lịch học:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật trạng thái lịch học"
    });
  }
};

/**
 * Xem lịch học của gia sư hoặc phụ huynh
 */
exports.viewSchedule = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.session.user.id;
    const db = await dbPromise;

    // Lấy các lịch học liên quan đến người dùng
    let schedules = [];

    if (req.session.user.role === 'admin') {
      // Admin có thể xem tất cả lịch học
      const [adminSchedules] = await db.query(
        `SELECT cs.*, c.parent_name, s.name as subject_name, g.name as grade_name,
           t.full_name as tutor_name, u.username as parent_username,
           tu.username as tutor_username
         FROM Class_Schedule cs
         JOIN Classes c ON cs.class_id = c.id
         JOIN Subjects s ON c.subject_id = s.id
         JOIN Grades g ON c.grade_id = g.id
         JOIN Users u ON c.user_id = u.id
         JOIN Tutors t ON cs.tutor_id = t.id
         JOIN Users tu ON t.user_id = tu.id
         ORDER BY cs.session_date ASC, cs.start_time ASC
         LIMIT 100`
      );
      
      schedules = adminSchedules;
    } else {
      // Kiểm tra người dùng có phải là gia sư không
      const [tutors] = await db.query(
        "SELECT id FROM Tutors WHERE user_id = ?",
        [userId]
      );

      if (tutors.length > 0) {
        // Lấy lịch học cho gia sư
        const tutorId = tutors[0].id;
        const [tutorSchedules] = await db.query(
          `SELECT cs.*, c.parent_name, s.name as subject_name, g.name as grade_name,
             u.username as parent_username
           FROM Class_Schedule cs
           JOIN Classes c ON cs.class_id = c.id
           JOIN Subjects s ON c.subject_id = s.id
           JOIN Grades g ON c.grade_id = g.id
           JOIN Users u ON c.user_id = u.id
           WHERE cs.tutor_id = ?
           ORDER BY cs.session_date ASC, cs.start_time ASC`,
          [tutorId]
        );
        
        schedules = tutorSchedules;
      } else {
        // Lấy lịch học cho phụ huynh (user thường)
        const [parentSchedules] = await db.query(
          `SELECT cs.*, s.name as subject_name, g.name as grade_name,
             t.full_name as tutor_name, tu.username as tutor_username
           FROM Class_Schedule cs
           JOIN Classes c ON cs.class_id = c.id
           JOIN Subjects s ON c.subject_id = s.id
           JOIN Grades g ON c.grade_id = g.id
           JOIN Tutors t ON cs.tutor_id = t.id
           JOIN Users tu ON t.user_id = tu.id
           WHERE c.user_id = ?
           ORDER BY cs.session_date ASC, cs.start_time ASC`,
          [userId]
        );
        
        schedules = parentSchedules;
      }
    }

    res.render("schedule/view", {
      title: "Lịch học",
      schedules,
      moment,
      userRole: req.session.user.role,
      userId
    });
  } catch (err) {
    console.error("Lỗi khi xem lịch học:", err);
    res.status(500).send("Đã xảy ra lỗi khi tải lịch học");
  }
}; 