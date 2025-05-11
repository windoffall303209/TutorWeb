const express = require("express");
const router = express.Router();
const tutorController = require("../controllers/tutorController");
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });

// Middleware để truyền thông báo lỗi từ session vào view
router.use((req, res, next) => {
  res.locals.error = req.session.error;
  delete req.session.error;
  next();
});

router.get("/", tutorController.getTutors);
router.get("/:id", tutorController.getTutorDetail);
router.post("/register", upload.single("photo"), tutorController.registerTutor);

module.exports = router;
