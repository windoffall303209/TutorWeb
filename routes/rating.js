const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");

// Routes cho đánh giá gia sư
router.post("/tutor", ratingController.ratingTutor);
router.get("/tutor/:tutorId", ratingController.getTutorRatings);
router.delete("/:ratingId", ratingController.deleteRating);

module.exports = router; 