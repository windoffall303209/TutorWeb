const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const classRegisterController = require("../controllers/classRegisterController");

// Middleware để truyền thông báo lỗi từ session vào view
router.use((req, res, next) => {
  res.locals.error = req.session.error;
  delete req.session.error;
  next();
});

router.get("/", classController.getClasses);
router.get("/:id", classController.getClassDetail);
router.post("/register", classRegisterController.registerForClass);
router.post("/create", classController.registerClass);
router.get("/registrations/tutor", classRegisterController.getTutorRegistrations);
router.get("/:classId/registrations", classRegisterController.getClassRegistrations);
router.post("/registrations/respond", classRegisterController.respondToRegistration);

module.exports = router;
