const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { checkAdmin } = require("../middleware/admin");

// Áp dụng middleware checkAdmin cho tất cả route admin
router.use(checkAdmin);

// Trang quản lý admin
router.get("/", adminController.getAdminDashboard);

// Quản lý người dùng
router.get("/users", adminController.getUsers);
router.get("/users/edit/:id", adminController.getEditUser);
router.post("/users/edit/:id", adminController.postEditUser);
router.post("/users/delete/:id", adminController.deleteUser);
router.post("/users/disable/:id", adminController.disableUser);
router.post("/users/enable/:id", adminController.enableUser); // Thêm route kích hoạt lại

// Quản lý lớp học
router.get("/classes", adminController.getClasses);
router.get("/classes/edit/:id", adminController.getEditClass);
router.post("/classes/edit/:id", adminController.postEditClass);
router.post("/classes/delete/:id", adminController.deleteClass);
router.post("/classes/disable/:id", adminController.disableClass);
router.post("/classes/enable/:id", adminController.enableClass); // Thêm route kích hoạt lại

// Quản lý gia sư
router.get("/tutors", adminController.getTutors);
router.get("/tutors/edit/:id", adminController.getEditTutor);
router.post("/tutors/edit/:id", adminController.postEditTutor);
router.post("/tutors/delete/:id", adminController.deleteTutor);
router.post("/tutors/disable/:id", adminController.disableTutor);
router.post("/tutors/enable/:id", adminController.enableTutor);
router.post("/tutors/:id/toggle-status", adminController.toggleTutorStatus);

module.exports = router;
