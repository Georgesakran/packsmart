// utils/tripActivityLogger.js
const queryAsync = require("./queryAsync");

const logTripActivity = async ({
  tripId,
  userId,
  eventType,
  title,
  details = null,
}) => {
  if (!tripId || !userId || !eventType || !title) return;

  await queryAsync(
    `
    INSERT INTO trip_activity_logs (
      trip_id,
      user_id,
      event_type,
      title,
      details
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [tripId, userId, eventType, title, details]
  );
};

module.exports = {
  logTripActivity,
};