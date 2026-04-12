const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getUserNotificationPreferences } = require("../services/tripReminderEngine");

const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await getUserNotificationPreferences(userId);

    return successResponse(
      res,
      "Notification preferences fetched successfully",
      preferences
    );
  } catch (error) {
    console.error("Get notification preferences error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      remindersEnabled = 1,
      quietModeEnabled = 0,
      quietStartTime = "22:00",
      quietEndTime = "08:00",
      preferredReminderTime = "18:00",
      preTripDaysBefore = 3,
      sameDayReminderEnabled = 1,
      checklistRemindersEnabled = 1,
      travelDayRemindersEnabled = 1,
    } = req.body;

    const existingRows = await queryAsync(
      `
      SELECT id
      FROM user_notification_preferences
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (existingRows.length === 0) {
      await queryAsync(
        `
        INSERT INTO user_notification_preferences (
          user_id,
          reminders_enabled,
          quiet_mode_enabled,
          quiet_start_time,
          quiet_end_time,
          preferred_reminder_time,
          pre_trip_days_before,
          same_day_reminder_enabled,
          checklist_reminders_enabled,
          travel_day_reminders_enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          remindersEnabled ? 1 : 0,
          quietModeEnabled ? 1 : 0,
          quietStartTime,
          quietEndTime,
          preferredReminderTime,
          Number(preTripDaysBefore || 3),
          sameDayReminderEnabled ? 1 : 0,
          checklistRemindersEnabled ? 1 : 0,
          travelDayRemindersEnabled ? 1 : 0,
        ]
      );
    } else {
      await queryAsync(
        `
        UPDATE user_notification_preferences
        SET
          reminders_enabled = ?,
          quiet_mode_enabled = ?,
          quiet_start_time = ?,
          quiet_end_time = ?,
          preferred_reminder_time = ?,
          pre_trip_days_before = ?,
          same_day_reminder_enabled = ?,
          checklist_reminders_enabled = ?,
          travel_day_reminders_enabled = ?
        WHERE user_id = ?
        `,
        [
          remindersEnabled ? 1 : 0,
          quietModeEnabled ? 1 : 0,
          quietStartTime,
          quietEndTime,
          preferredReminderTime,
          Number(preTripDaysBefore || 3),
          sameDayReminderEnabled ? 1 : 0,
          checklistRemindersEnabled ? 1 : 0,
          travelDayRemindersEnabled ? 1 : 0,
          userId,
        ]
      );
    }

    return successResponse(res, "Notification preferences updated successfully");
  } catch (error) {
    console.error("Update notification preferences error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
};