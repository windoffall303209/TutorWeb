const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const gradeSubjectController = require("../controllers/gradeSubjectController");

// Class routes
router.get("/classes", classController.getClasses);
router.get("/classes/:id", classController.getClassDetail);
router.post("/classes/register", classController.registerClass);

// Grade and Subject routes
router.get("/grades", gradeSubjectController.getGrades);
router.get("/subjects", gradeSubjectController.getSubjects);

// Admin routes for grades and subjects
router.post("/grades", gradeSubjectController.addGrade);
router.post("/subjects", gradeSubjectController.addSubject);
router.put("/grades/:id", gradeSubjectController.updateGrade);
router.put("/subjects/:id", gradeSubjectController.updateSubject);
router.delete("/grades/:id", gradeSubjectController.deleteGrade);
router.delete("/subjects/:id", gradeSubjectController.deleteSubject);

module.exports = router;
