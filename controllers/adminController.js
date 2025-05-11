const dbPromise = require("../config/db");

exports.getAdminDashboard = async (req, res) => {
  try {
    const db = await dbPromise;

    // Get user statistics
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
      FROM users
    `);

    // Get class statistics
    const [classStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as occupied
      FROM classes
      WHERE is_active = 1
    `);

    // Get tutor statistics
    const [tutorStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
      FROM tutors
    `);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      user: req.session.user,
      userStats: userStats[0],
      classStats: classStats[0],
      tutorStats: tutorStats[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Người dùng
exports.getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  try {
    const db = await dbPromise;
    const [countResult] = await db.query("SELECT COUNT(*) as total FROM users");
    const totalUsers = countResult[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    const [results] = await db.query("SELECT * FROM users LIMIT ? OFFSET ?", [
      limit,
      offset,
    ]);

    res.render("admin/users", {
      title: "Quản lý người dùng",
      users: results,
      currentPage: page,
      totalPages,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getEditUser = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    const [results] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (results.length === 0)
      return res.status(404).send("Người dùng không tồn tại");

    res.render("admin/edit_user", {
      title: "Sửa người dùng",
      editUser: results[0],
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.postEditUser = async (req, res) => {
  const id = req.params.id;
  const { username, role } = req.body;
  try {
    const db = await dbPromise;
    await db.query("UPDATE users SET username = ?, role = ? WHERE id = ?", [
      username,
      role,
      id,
    ]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.disableUser = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.enableUser = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("UPDATE users SET is_active = 1 WHERE id = ?", [id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Lớp học
exports.getClasses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;
  const status = req.query.status || "active";

  try {
    const db = await dbPromise;

    // Xây dựng điều kiện WHERE dựa trên status
    let whereClause = "";
    if (status === "active") {
      whereClause = "WHERE c.is_active = 1";
    } else if (status === "inactive") {
      whereClause = "WHERE c.is_active = 0";
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM classes c ${whereClause}`
    );
    const totalClasses = countResult[0].total;
    const totalPages = Math.ceil(totalClasses / limit);

    const [results] = await db.query(
      `
      SELECT c.*, g.name as grade_name, s.name as subject_name, u.username
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    res.render("admin/classes", {
      title: "Quản lý lớp học",
      classes: results,
      currentPage: page,
      totalPages,
      status,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getEditClass = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    const [classResult] = await db.query(
      `
      SELECT c.*, g.name as grade_name, s.name as subject_name, u.username
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `,
      [id]
    );

    if (classResult.length === 0)
      return res.status(404).send("Lớp học không tồn tại");

    const [grades] = await db.query("SELECT * FROM grades WHERE is_active = 1");
    const [subjects] = await db.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );

    res.render("admin/edit_classes", {
      title: "Sửa lớp học",
      editClass: classResult[0],
      grades,
      subjects,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.postEditClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      parent_name,
      phone,
      district,
      province,
      specific_address,
      tutor_gender,
      sessions_per_week,
      fee_per_session,
      grade_id,
      subject_id,
      description,
      status,
      learning_mode,
    } = req.body;

    const db = await dbPromise;
    await db.query(
      `
      UPDATE classes SET 
        parent_name = ?,
        phone = ?,
        district = ?,
        province = ?,
        specific_address = ?,
        tutor_gender = ?,
        sessions_per_week = ?,
        fee_per_session = ?,
        grade_id = ?,
        subject_id = ?,
        description = ?,
        status = ?,
        learning_mode = ?
      WHERE id = ?
    `,
      [
        parent_name,
        phone,
        district,
        province,
        specific_address,
        tutor_gender,
        sessions_per_week,
        fee_per_session,
        grade_id,
        subject_id,
        description,
        status,
        learning_mode,
        id,
      ]
    );

    res.redirect("/admin/classes");
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).send("Error updating class");
  }
};

exports.deleteClass = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("DELETE FROM classes WHERE id = ?", [id]);
    res.redirect("/admin/classes");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.disableClass = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("UPDATE Classes SET is_active = 0 WHERE id = ?", [id]);
    res.redirect("/admin/classes");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.enableClass = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("UPDATE Classes SET is_active = 1 WHERE id = ?", [id]);
    res.redirect("/admin/classes");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Gia sư
exports.getTutors = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;
  const status = req.query.status || "active";

  try {
    const db = await dbPromise;

    // Xây dựng điều kiện WHERE dựa trên status
    let whereClause = "";
    if (status === "active") {
      whereClause = "WHERE t.is_active = 1";
    } else if (status === "inactive") {
      whereClause = "WHERE t.is_active = 0";
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM tutors t ${whereClause}`
    );
    const totalTutors = countResult[0].total;
    const totalPages = Math.ceil(totalTutors / limit);

    // Lấy danh sách gia sư
    const [results] = await db.query(
      `
      SELECT t.*, u.username
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    // Lấy thông tin môn học và khối lớp cho mỗi gia sư
    for (let tutor of results) {
      // Lấy danh sách môn học
      const [subjects] = await db.query(
        `SELECT s.* FROM subjects s 
         INNER JOIN tutor_subjects ts ON s.id = ts.subject_id 
         WHERE ts.tutor_id = ? AND s.is_active = 1`,
        [tutor.id]
      );
      tutor.subjects = subjects;

      // Lấy danh sách khối lớp
      const [grades] = await db.query(
        `SELECT g.* FROM grades g 
         INNER JOIN tutor_grades tg ON g.id = tg.grade_id 
         WHERE tg.tutor_id = ? AND g.is_active = 1`,
        [tutor.id]
      );
      tutor.grades = grades;
    }

    res.render("admin/tutors", {
      title: "Quản lý gia sư",
      tutors: results,
      currentPage: page,
      totalPages,
      status,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getEditTutor = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    const [results] = await db.query(
      `
      SELECT t.*, u.username
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `,
      [id]
    );

    if (results.length === 0)
      return res.status(404).send("Gia sư không tồn tại");

    // Lấy danh sách khối lớp và môn học
    const [grades] = await db.query("SELECT * FROM grades WHERE is_active = 1");
    const [subjects] = await db.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );

    res.render("admin/edit_tutors", {
      title: "Sửa gia sư",
      editTutor: results[0],
      grades,
      subjects,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.postEditTutor = async (req, res) => {
  const id = req.params.id;
  const {
    full_name,
    birth_year,
    gender,
    address,
    district,
    province,
    classes_teach,
    subjects_teach,
    education_level,
    introduction,
    phone,
    is_active,
  } = req.body;

  try {
    const db = await dbPromise;
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Cập nhật thông tin cơ bản của gia sư
      await connection.query(
        `
        UPDATE tutors SET 
          full_name = ?,
          birth_year = ?,
          gender = ?,
          address = ?,
          district = ?,
          province = ?,
          education_level = ?,
          introduction = ?,
          phone = ?,
          is_active = ?
        WHERE id = ?
      `,
        [
          full_name,
          birth_year,
          gender,
          address,
          district,
          province,
          education_level,
          introduction,
          phone,
          is_active,
          id,
        ]
      );

      // Xóa các môn học cũ
      await connection.query("DELETE FROM tutor_subjects WHERE tutor_id = ?", [
        id,
      ]);

      // Thêm các môn học mới
      if (Array.isArray(subjects_teach) && subjects_teach.length > 0) {
        const subjectValues = subjects_teach.map((subjectId) => [
          id,
          subjectId,
        ]);
        await connection.query(
          "INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES ?",
          [subjectValues]
        );
      }

      // Xóa các khối lớp cũ
      await connection.query("DELETE FROM tutor_grades WHERE tutor_id = ?", [
        id,
      ]);

      // Thêm các khối lớp mới
      if (Array.isArray(classes_teach) && classes_teach.length > 0) {
        const gradeValues = classes_teach.map((gradeId) => [id, gradeId]);
        await connection.query(
          "INSERT INTO tutor_grades (tutor_id, grade_id) VALUES ?",
          [gradeValues]
        );
      }

      await connection.commit();
      connection.release();
      res.redirect("/admin/tutors");
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteTutor = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("DELETE FROM tutors WHERE id = ?", [id]);
    res.redirect("/admin/tutors");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.disableTutor = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("UPDATE tutors SET is_active = 0 WHERE id = ?", [id]);
    res.redirect("/admin/tutors");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.enableTutor = async (req, res) => {
  const id = req.params.id;
  try {
    const db = await dbPromise;
    await db.query("UPDATE tutors SET is_active = 1 WHERE id = ?", [id]);
    res.redirect("/admin/tutors");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.toggleTutorStatus = async (req, res) => {
  const id = req.params.id;
  const { is_active } = req.body;

  try {
    const db = await dbPromise;
    await db.query("UPDATE tutors SET is_active = ? WHERE id = ?", [
      is_active === "on" ? 1 : 0,
      id,
    ]);

    // Chuyển hướng về trang chi tiết gia sư
    res.redirect(`/tutors/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = exports;
