const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const authMiddleware = require("../middleware/authMiddleware");

// Route hiển thị danh sách lớp học
router.get("/", classController.getClasses);

// Route hiển thị chi tiết lớp học
router.get("/:id", classController.getClassDetail);

// Route hiển thị form đăng ký lớp học
router.get(
  "/register/form",
  authMiddleware.isLoggedIn,
  classController.showRegisterForm
);

// Route xử lý đăng ký lớp học
router.post(
  "/register",
  authMiddleware.isLoggedIn,
  classController.registerClass
);

module.exports = router;
