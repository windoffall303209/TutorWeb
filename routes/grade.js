const express = require("express");
const router = express.Router();
const gradeController = require("../controllers/gradeController");
const Grade = require("../models/grade");
const { isAdmin } = require("../middleware/auth");

// Hiển thị danh sách cấp lớp
router.get("/", gradeController.getGrades);

// Hiển thị form thêm cấp lớp mới
router.get("/create", isAdmin, (req, res) => {
  res.render("grades/form", {
    title: "Thêm cấp lớp mới",
    user: req.session.user,
  });
});

// Thêm cấp lớp mới
router.post("/", isAdmin, gradeController.createGrade);

// Hiển thị chi tiết cấp lớp
router.get("/:id", gradeController.getGradeDetail);

// Hiển thị form sửa cấp lớp
router.get("/:id/edit", isAdmin, async (req, res) => {
  try {
    const grade = await Grade.getById(req.params.id);
    if (!grade) {
      return res.status(404).send("Cấp lớp không tồn tại");
    }
    res.render("grades/form", {
      title: "Sửa cấp lớp",
      grade,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Cập nhật cấp lớp
router.put("/:id", isAdmin, gradeController.updateGrade);

// Xóa cấp lớp
router.delete("/:id", isAdmin, gradeController.deleteGrade);

module.exports = router;
