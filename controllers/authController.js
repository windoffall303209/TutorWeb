const bcrypt = require("bcrypt");
const dbPromise = require("../config/db");
const crypto = require("crypto");

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await dbPromise;
    const [results] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (results.length === 0) {
      console.log("Rendering auth/login with error: User not found");
      return res.render("auth/login", {
        title: "Đăng nhập",
        user: req.session.user,
        error: "Tên đăng nhập hoặc mật khẩu sai",
      });
    }
    const user = results[0];
    if (!user.is_active) {
      console.log("Rendering auth/login with error: Account disabled");
      return res.render("auth/login", {
        title: "Đăng nhập",
        user: req.session.user,
        error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin.",
      });
    }
    if (await bcrypt.compare(password, user.password)) {
      console.log("Login successful");
      
      // Kiểm tra xem người dùng có phải là gia sư không
      const [tutorResults] = await db.query(
        "SELECT id FROM Tutors WHERE user_id = ?",
        [user.id]
      );
      
      const userSession = {
        id: user.id,
        username: user.username,
        role: user.role,
        is_tutor: tutorResults.length > 0 // Thêm thuộc tính is_tutor vào session
      };
      
      req.session.user = userSession;
      
      if (req.query.returnUrl) {
        return res.redirect(req.query.returnUrl);
      }
      
      if (user.role === "admin") {
        return res.redirect("/admin");
      }
      
      return res.redirect("/");
    } else {
      console.log("Rendering auth/login with error: Incorrect password");
      return res.render("auth/login", {
        title: "Đăng nhập",
        user: req.session.user,
        error: "Tên đăng nhập hoặc mật khẩu sai",
      });
    }
  } catch (err) {
    console.error("Error during login:", err);
    return res.render("auth/login", {
      title: "Đăng nhập",
      user: req.session.user,
      error: "Đã xảy ra lỗi khi đăng nhập",
    });
  }
};

exports.register = async (req, res) => {
  const { display_name, username, password, confirm_password, email } =
    req.body;
  // Kiểm tra xác nhận mật khẩu
  if (password !== confirm_password) {
    return res.render("auth/register", {
      title: "Đăng ký",
      error: "Mật khẩu và xác nhận mật khẩu không khớp",
    });
  }
  try {
    const db = await dbPromise;
    // Kiểm tra username đã tồn tại chưa
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) {
      return res.render("auth/register", {
        title: "Đăng ký",
        error: "Tên đăng nhập đã tồn tại",
      });
    }

    // Kiểm tra email đã tồn tại chưa (nếu có cung cấp email)
    if (email) {
      const [existingEmail] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      if (existingEmail.length > 0) {
        return res.render("auth/register", {
          title: "Đăng ký",
          error: "Email đã được sử dụng bởi tài khoản khác",
        });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, password, display_name, email, is_active) VALUES (?, ?, ?, ?, 1)",
      [username, hash, display_name, email || null]
    );
    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    res.status(500).render("auth/register", {
      title: "Đăng ký",
      error: "Có lỗi xảy ra, vui lòng thử lại",
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/auth/login");
};

// Hiển thị form quên mật khẩu
exports.showForgotPasswordForm = (req, res) => {
  res.render("auth/forgot_password", {
    title: "Quên mật khẩu",
  });
};

// Xử lý yêu cầu quên mật khẩu
exports.processForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const db = await dbPromise;

    // Kiểm tra email tồn tại
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.render("auth/forgot_password", {
        title: "Quên mật khẩu",
        message: "Email không tồn tại trong hệ thống",
        messageType: "danger",
      });
    }

    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 giờ

    // Lưu token vào cơ sở dữ liệu
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [resetToken, resetTokenExpires, email]
    );

    // Đáng lẽ sẽ gửi email ở đây, nhưng hiện tại chúng ta sẽ chỉ giả lập

    // Trong thực tế:
    // const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;
    // sendResetPasswordEmail(email, resetUrl);

    // Debug: Hiển thị URL đặt lại mật khẩu trên trang
    const resetUrl = `/auth/reset-password/${resetToken}`;

    return res.render("auth/forgot_password", {
      title: "Quên mật khẩu",
      message: `Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn. Để thuận tiện cho demo, bạn có thể nhấn vào <a href="${resetUrl}">liên kết này</a> để đặt lại mật khẩu.`,
      messageType: "success",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.render("auth/forgot_password", {
      title: "Quên mật khẩu",
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      messageType: "danger",
    });
  }
};

// Hiển thị form đặt lại mật khẩu
exports.showResetPasswordForm = async (req, res) => {
  const { token } = req.params;

  try {
    const db = await dbPromise;

    // Kiểm tra token có hợp lệ không
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.render("auth/forgot_password", {
        title: "Quên mật khẩu",
        message:
          "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.",
        messageType: "danger",
      });
    }

    res.render("auth/reset_password", {
      title: "Đặt lại mật khẩu",
      token: token,
    });
  } catch (error) {
    console.error("Error in reset password form:", error);
    return res.render("auth/forgot_password", {
      title: "Quên mật khẩu",
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      messageType: "danger",
    });
  }
};

// Xử lý đặt lại mật khẩu
exports.processResetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  // Kiểm tra mật khẩu và xác nhận mật khẩu
  if (password !== confirmPassword) {
    return res.render("auth/reset_password", {
      title: "Đặt lại mật khẩu",
      message: "Mật khẩu và xác nhận mật khẩu không khớp",
      messageType: "danger",
      token: token,
    });
  }

  try {
    const db = await dbPromise;

    // Kiểm tra token có hợp lệ không
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.render("auth/forgot_password", {
        title: "Quên mật khẩu",
        message:
          "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.",
        messageType: "danger",
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu và xóa token
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, users[0].id]
    );

    return res.render("auth/login", {
      title: "Đăng nhập",
      user: req.session.user,
      error:
        "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    console.error("Error in processing reset password:", error);
    return res.render("auth/reset_password", {
      title: "Đặt lại mật khẩu",
      message: "Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại sau.",
      messageType: "danger",
      token: token,
    });
  }
};
