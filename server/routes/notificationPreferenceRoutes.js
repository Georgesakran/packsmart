const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotificationPreferences,
  updateNotificationPreferences,
} = require("../controllers/notificationPreferenceController");

router.get("/notification-preferences", protect, getNotificationPreferences);
router.put("/notification-preferences", protect, updateNotificationPreferences);

module.exports = router;