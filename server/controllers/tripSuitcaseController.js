const db = require("../config/db");

const getOwnedTrip = (tripId, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(query, [tripId, userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

const queryAsync = (query, values = []) =>
  new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });


const getTripSuitcases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const suitcases = await queryAsync(
      `
      SELECT *
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC
      `,
      [tripId]
    );

    return res.status(200).json(suitcases);
  } catch (error) {
    console.error("Get trip suitcases error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTripSuitcases,
};