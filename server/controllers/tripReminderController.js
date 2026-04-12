const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { generateTripReminders } = require("../services/tripReminderEngine");

const getUserTripReminders = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await queryAsync(
      `
      SELECT *
      FROM trip_reminders
      WHERE user_id = ?
      ORDER BY scheduled_for ASC, id DESC
      `,
      [userId]
    );

    return successResponse(res, "Trip reminders fetched successfully", rows);
  } catch (error) {
    console.error("Get user trip reminders error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getTripRemindersByTripId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tripRows = await queryAsync(
      `
      SELECT id
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (tripRows.length === 0) {
      return errorResponse(res, "Trip not found", 404);
    }

    const rows = await queryAsync(
      `
      SELECT *
      FROM trip_reminders
      WHERE trip_id = ? AND user_id = ?
      ORDER BY scheduled_for ASC, id DESC
      `,
      [id, userId]
    );

    return successResponse(res, "Trip reminders fetched successfully", rows);
  } catch (error) {
    console.error("Get trip reminders by trip id error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const generateRemindersForTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await generateTripReminders({
      tripId: id,
      userId,
    });

    return successResponse(res, "Trip reminders generated successfully", result);
  } catch (error) {
    console.error("Generate reminders for trip error:", error.message);

    if (error.message === "Trip not found") {
      return errorResponse(res, "Trip not found", 404);
    }

    return errorResponse(res, "Server error", 500);
  }
};

const dismissTripReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const rows = await queryAsync(
      `
      SELECT *
      FROM trip_reminders
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (rows.length === 0) {
      return errorResponse(res, "Trip reminder not found", 404);
    }

    await queryAsync(
      `
      UPDATE trip_reminders
      SET status = 'dismissed'
      WHERE id = ? AND user_id = ?
      `,
      [id, userId]
    );

    return successResponse(res, "Trip reminder dismissed successfully");
  } catch (error) {
    console.error("Dismiss trip reminder error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getUserTripReminders,
  getTripRemindersByTripId,
  generateRemindersForTrip,
  dismissTripReminder,
};