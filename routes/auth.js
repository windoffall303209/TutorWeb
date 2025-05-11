const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", (req, res) => {
  console.log("Rendering auth/login"); // Debug
  res.render("auth/login", { title: "Đăng nhập", user: req.session.user });
});

router.post("/login", authController.login);

router.get("/register", (req, res) => {
  console.log("Rendering auth/register"); // Debug
  res.render("auth/register", { title: "Đăng ký", user: req.session.user });
});

router.post("/register", authController.register);

router.get("/logout", authController.logout);

// Các route cho quên mật khẩu
router.get("/forgot-password", authController.showForgotPasswordForm);
router.post("/forgot-password", authController.processForgotPassword);
router.get("/reset-password/:token", authController.showResetPasswordForm);
router.post("/reset-password", authController.processResetPassword);

module.exports = router;
