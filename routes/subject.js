const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const Subject = require("../models/subject");

// Hiển thị danh sách môn học
router.get("/", subjectController.getSubjects);

// Hiển thị form thêm môn học mới
router.get("/create", (req, res) => {
  res.render("subjects/form", {
    title: "Thêm môn học mới",
    user: req.session.user,
  });
});

// Thêm môn học mới
router.post("/", subjectController.createSubject);

// Hiển thị chi tiết môn học
router.get("/:id", subjectController.getSubjectDetail);

// Hiển thị form sửa môn học
router.get("/:id/edit", async (req, res) => {
  try {
    const subject = await Subject.getById(req.params.id);
    if (!subject) {
      return res.status(404).send("Môn học không tồn tại");
    }
    res.render("subjects/form", {
      title: "Sửa môn học",
      subject,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Cập nhật môn học
router.put("/:id", subjectController.updateSubject);

// Xóa môn học
router.delete("/:id", subjectController.deleteSubject);

module.exports = router;
