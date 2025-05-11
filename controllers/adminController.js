const db = require("../config/db");

exports.getAdminDashboard = (req, res) => {
  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    user: req.session.user,
  });
};

// Người dùng
exports.getUsers = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15; // Giới hạn 9 người dùng mỗi trang
  const offset = (page - 1) * limit;

  db.query("SELECT COUNT(*) as total FROM users", (err, countResult) => {
    if (err) throw err;
    const totalUsers = countResult[0].total;
    const totalPages = Math.ceil(totalUsers / limit);

    db.query(
      "SELECT * FROM users LIMIT ? OFFSET ?",
      [limit, offset],
      (err, results) => {
        if (err) throw err;
        res.render("admin/users", {
          title: "Quản lý người dùng",
          users: results,
          currentPage: page,
          totalPages,
          user: req.session.user,
        });
      }
    );
  });
};
exports.getEditUser = (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
    if (err) throw err;
    if (results.length === 0)
      return res.status(404).send("Người dùng không tồn tại");
    res.render("admin/edit_user", {
      title: "Sửa người dùng",
      editUser: results[0],
      user: req.session.user,
    });
  });
};

exports.postEditUser = (req, res) => {
  const id = req.params.id;
  const { username, role } = req.body;
  db.query(
    "UPDATE users SET username = ?, role = ? WHERE id = ?",
    [username, role, id],
    (err) => {
      if (err) throw err;
      res.redirect("/admin/users");
    }
  );
};

exports.deleteUser = (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/users");
  });
};

exports.disableUser = (req, res) => {
  const id = req.params.id;
  db.query("UPDATE users SET is_active = 0 WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/users");
  });
};

exports.enableUser = (req, res) => {
  const id = req.params.id;
  db.query("UPDATE users SET is_active = 1 WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/users");
  });
};

// Lớp học
exports.getClasses = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15; // Giới hạn 9 lớp mỗi trang
  const offset = (page - 1) * limit;

  db.query("SELECT COUNT(*) as total FROM classes", (err, countResult) => {
    if (err) throw err;
    const totalClasses = countResult[0].total;
    const totalPages = Math.ceil(totalClasses / limit);

    db.query(
      "SELECT * FROM classes LIMIT ? OFFSET ?",
      [limit, offset],
      (err, results) => {
        if (err) throw err;
        res.render("admin/classes", {
          title: "Quản lý lớp học",
          classes: results,
          currentPage: page,
          totalPages,
          user: req.session.user,
        });
      }
    );
  });
};

exports.getEditClass = (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM classes WHERE id = ?", [id], (err, results) => {
    if (err) throw err;
    if (results.length === 0)
      return res.status(404).send("Lớp học không tồn tại");
    res.render("admin/edit_classes", {
      title: "Sửa lớp học",
      editClass: results[0],
      user: req.session.user,
    });
  });
};

exports.postEditClass = (req, res) => {
  const id = req.params.id;
  const {
    parent_name,
    phone,
    subject,
    grade,
    fee_per_session,
    learning_mode,
    status,
  } = req.body;
  db.query(
    "UPDATE classes SET parent_name = ?, phone = ?, subject = ?, grade = ?, fee_per_session = ?, learning_mode = ?, status = ? WHERE id = ?",
    [
      parent_name,
      phone,
      subject,
      grade,
      fee_per_session,
      learning_mode,
      status,
      id,
    ],
    (err) => {
      if (err) throw err;
      res.redirect("/admin/classes");
    }
  );
};

exports.deleteClass = (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM classes WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/classes");
  });
};

exports.disableClass = (req, res) => {
  const id = req.params.id;
  db.query("UPDATE classes SET is_active = 0 WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/classes");
  });
};

exports.enableClass = (req, res) => {
  const id = req.params.id;
  db.query("UPDATE classes SET is_active = 1 WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/classes");
  });
};

// Gia sư
exports.getTutors = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15; // Giới hạn 9 gia sư mỗi trang
  const offset = (page - 1) * limit;

  db.query("SELECT COUNT(*) as total FROM tutors", (err, countResult) => {
    if (err) throw err;
    const totalTutors = countResult[0].total;
    const totalPages = Math.ceil(totalTutors / limit);

    db.query(
      "SELECT * FROM tutors LIMIT ? OFFSET ?",
      [limit, offset],
      (err, results) => {
        if (err) throw err;
        res.render("admin/tutors", {
          title: "Quản lý gia sư",
          tutors: results,
          currentPage: page,
          totalPages,
          user: req.session.user,
        });
      }
    );
  });
};

exports.getEditTutor = (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM tutors WHERE id = ?", [id], (err, results) => {
    if (err) throw err;
    if (results.length === 0)
      return res.status(404).send("Gia sư không tồn tại");
    res.render("admin/edit_tutors", {
      title: "Sửa gia sư",
      editTutor: results[0],
      user: req.session.user,
    });
  });
};

exports.postEditTutor = (req, res) => {
  const id = req.params.id;
  const { full_name, birth_year, gender, subjects_teach } = req.body;
  db.query(
    "UPDATE tutors SET full_name = ?, birth_year = ?, gender = ?, subjects_teach = ? WHERE id = ?",
    [full_name, birth_year, gender, subjects_teach, id],
    (err) => {
      if (err) throw err;
      res.redirect("/admin/tutors");
    }
  );
};

exports.deleteTutor = (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM tutors WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/tutors");
  });
};

exports.disableTutor = (req, res) => {
  const id = req.params.id;
  db.query("UPDATE tutors SET is_active = 0 WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/tutors");
  });
};

exports.enableTutor = (req, res) => {
  const id = req.params.id;
  db.query("UPDATE tutors SET is_active = 1 WHERE id = ?", [id], (err) => {
    if (err) throw err;
    res.redirect("/admin/tutors");
  });
};

module.exports = exports;
