const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.get("/", chatController.index);
router.get("/messages", chatController.getMessages);
router.get("/search-users", chatController.searchUsers);

module.exports = router;
