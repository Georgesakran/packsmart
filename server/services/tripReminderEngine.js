const queryAsync = require("../utils/queryAsync");

const DEFAULT_PREFERENCES = {
  reminders_enabled: 1,
  quiet_mode_enabled: 0,
  quiet_start_time: "22:00",
  quiet_end_time: "08:00",
  preferred_reminder_time: "18:00",
  pre_trip_days_before: 3,
  same_day_reminder_enabled: 1,
  checklist_reminders_enabled: 1,
  travel_day_reminders_enabled: 1,
};

const parseDateAtTime = (dateValue, timeValue = "18:00") => {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const [hours, minutes] = String(timeValue || "18:00")
    .split(":")
    .map((value) => Number(value || 0));

  date.setHours(hours || 18, minutes || 0, 0, 0);
  return date;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const upsertReminderIfMissing = async ({
  tripId,
  userId,
  reminderType,
  title,
  body,
  scheduledFor,
}) => {
  if (!isValidDate(scheduledFor)) return false;

  const existing = await queryAsync(
    `
    SELECT id
    FROM trip_reminders
    WHERE trip_id = ? AND user_id = ? AND reminder_type = ? AND status = 'scheduled'
    LIMIT 1
    `,
    [tripId, userId, reminderType]
  );

  if (existing.length > 0) {
    return false;
  }

  await queryAsync(
    `
    INSERT INTO trip_reminders (
      trip_id,
      user_id,
      reminder_type,
      title,
      body,
      scheduled_for,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `,
    [tripId, userId, reminderType, title, body, scheduledFor]
  );

  return true;
};

const getUserNotificationPreferences = async (userId) => {
  const rows = await queryAsync(
    `
    SELECT *
    FROM user_notification_preferences
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (rows.length > 0) return rows[0];

  return { user_id: userId, ...DEFAULT_PREFERENCES };
};

const buildTripReminderCandidates = ({ trip, tripItems, tripResults, preferences }) => {
  const reminders = [];
  const preferredTime = preferences.preferred_reminder_time || "18:00";
  const startDate = trip?.start_date ? new Date(trip.start_date) : null;
  const now = new Date();

  const hasItems = Array.isArray(tripItems) && tripItems.length > 0;
  const hasResults = !!tripResults;
  const checklistDoneCount = hasItems
    ? tripItems.filter((item) => {
        const status = item.packing_status || "pending";
        return status !== "pending";
      }).length
    : 0;

  const travelDayConfiguredCount = hasItems
    ? tripItems.filter((item) => {
        const mode = item.travel_day_mode || "normal";
        return mode !== "normal";
      }).length
    : 0;

  if (hasItems && !hasResults) {
    reminders.push({
      reminderType: "calculate_trip",
      title: "Calculate your trip",
      body: "You added items, but this trip has not been calculated yet.",
      scheduledFor: new Date(now.getTime() + 60 * 60 * 1000),
    });
  }

  if (
    preferences.checklist_reminders_enabled &&
    hasItems &&
    checklistDoneCount === 0 &&
    hasResults
  ) {
    reminders.push({
      reminderType: "checklist_start",
      title: "Start your packing checklist",
      body: "Your trip is calculated, but the packing checklist has not started yet.",
      scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });
  }

  if (
    preferences.travel_day_reminders_enabled &&
    hasItems &&
    travelDayConfiguredCount === 0 &&
    hasResults
  ) {
    reminders.push({
      reminderType: "travel_day_setup",
      title: "Set your travel-day items",
      body: "Mark what to wear and what to keep accessible on travel day.",
      scheduledFor: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    });
  }

  if (startDate && preferences.pre_trip_days_before > 0) {
    const preTripDate = new Date(startDate);
    preTripDate.setDate(preTripDate.getDate() - Number(preferences.pre_trip_days_before || 3));

    const scheduled = parseDateAtTime(preTripDate, preferredTime);

    reminders.push({
      reminderType: "pre_trip",
      title: "Trip preparation reminder",
      body: `Your trip "${trip.trip_name}" is coming soon. Review bags, items, and packing readiness.`,
      scheduledFor: scheduled,
    });
  }

  if (startDate && preferences.same_day_reminder_enabled) {
    const sameDayScheduled = parseDateAtTime(startDate, preferredTime);

    reminders.push({
      reminderType: "same_day",
      title: "Today is your trip day",
      body: `Final review for "${trip.trip_name}": check your essentials and travel-day items.`,
      scheduledFor: sameDayScheduled,
    });
  }

  return reminders.filter((entry) => isValidDate(entry.scheduledFor));
};

const generateTripReminders = async ({ tripId, userId }) => {
  const preferences = await getUserNotificationPreferences(userId);

  if (!Number(preferences.reminders_enabled)) {
    return {
      createdCount: 0,
      skipped: "Reminders are disabled for this user.",
    };
  }

  const tripRows = await queryAsync(
    `
    SELECT *
    FROM trips
    WHERE id = ? AND user_id = ?
    LIMIT 1
    `,
    [tripId, userId]
  );

  if (tripRows.length === 0) {
    throw new Error("Trip not found");
  }

  const trip = tripRows[0];

  const tripItems = await queryAsync(
    `
    SELECT *
    FROM trip_items
    WHERE trip_id = ?
    ORDER BY id ASC
    `,
    [tripId]
  );

  const resultRows = await queryAsync(
    `
    SELECT *
    FROM trip_results
    WHERE trip_id = ?
    LIMIT 1
    `,
    [tripId]
  );

  const tripResults = resultRows[0] || null;

  const candidates = buildTripReminderCandidates({
    trip,
    tripItems,
    tripResults,
    preferences,
  });

  let createdCount = 0;

  for (const reminder of candidates) {
    const created = await upsertReminderIfMissing({
      tripId,
      userId,
      reminderType: reminder.reminderType,
      title: reminder.title,
      body: reminder.body,
      scheduledFor: reminder.scheduledFor,
    });

    if (created) createdCount += 1;
  }

  return {
    createdCount,
    candidateCount: candidates.length,
  };
};

module.exports = {
  getUserNotificationPreferences,
  generateTripReminders,
};