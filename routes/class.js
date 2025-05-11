const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

// Middleware để truyền thông báo lỗi từ session vào view
router.use((req, res, next) => {
  res.locals.error = req.session.error;
  delete req.session.error;
  next();
});

router.get("/", classController.getClasses);
router.get("/:id", classController.getClassDetail);
router.post("/register", classController.registerClass);

module.exports = router;
