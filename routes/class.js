const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

router.get("/", classController.getClasses);
router.get("/:id", classController.getClassDetail);
router.post("/register", classController.registerClass);

module.exports = router;
