const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUserTripReminders,
  getTripRemindersByTripId,
  generateRemindersForTrip,
  dismissTripReminder,
} = require("../controllers/tripReminderController");

router.get("/trip-reminders", protect, getUserTripReminders);
router.get("/trips/:id/reminders", protect, getTripRemindersByTripId);
router.post("/trips/:id/generate-reminders", protect, generateRemindersForTrip);
router.put("/trip-reminders/:id/dismiss", protect, dismissTripReminder);

module.exports = router;