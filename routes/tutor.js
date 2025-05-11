const express = require("express");
const router = express.Router();
const tutorController = require("../controllers/tutorController");
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });

router.get("/", tutorController.getTutors);
router.get("/:id", tutorController.getTutorDetail);
router.post("/register", upload.single("photo"), tutorController.registerTutor);

module.exports = router;
