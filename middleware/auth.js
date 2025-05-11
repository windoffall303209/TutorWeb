const db = require("../config/db");

const checkActiveUser = (req, res, next) => {
  if (req.session.user) {
    db.query(
      "SELECT is_active FROM users WHERE id = ?",
      [req.session.user.id],
      (err, results) => {
        if (err) {
          console.error("Database error in checkActiveUser:", err);
          return res.status(500).send("Lỗi hệ thống");
        }
        if (results.length === 0 || !results[0].is_active) {
          req.session.destroy(() => {
            console.log("User session destroyed due to inactive status");
            res.redirect("/auth/login");
          });
        } else {
          next();
        }
      }
    );
  } else {
    next(); // Nếu chưa đăng nhập, cho qua (các route công khai như login/register vẫn truy cập được)
  }
};

module.exports = { checkActiveUser };
