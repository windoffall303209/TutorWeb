const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

// Routes cho lịch học
router.get("/", scheduleController.viewSchedule);
router.get("/create/:classId", scheduleController.getCreateScheduleForm);
router.post("/create", scheduleController.createSchedule);
router.put("/status", scheduleController.updateScheduleStatus);

module.exports = router; 