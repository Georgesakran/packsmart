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

    return res.status(200).json({
      message: "Trip suitcases fetched successfully",
      data: suitcases,
    });
  } catch (error) {
    console.error("Get trip suitcases error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const createTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const {
      suitcaseType,
      name,
      volumeCm3,
      maxWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      isCustom,
      bagRole,
      isPrimary,
    } = req.body;

    if (!name || !bagRole) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await queryAsync(
      `
      INSERT INTO trip_suitcases (
        trip_id,
        suitcase_type,
        name,
        volume_cm3,
        max_weight_kg,
        length_cm,
        width_cm,
        height_cm,
        is_custom,
        bag_role,
        is_primary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        tripId,
        suitcaseType || "custom",
        name,
        Number(volumeCm3 || 0),
        Number(maxWeightKg || 0),
        Number(lengthCm || 0),
        Number(widthCm || 0),
        Number(heightCm || 0),
        isCustom ? 1 : 0,
        bagRole || "main",
        isPrimary ? 1 : 0,
      ]
    );

    const createdRows = await queryAsync(
      `
      SELECT *
      FROM trip_suitcases
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      message: "Trip suitcase created successfully",
      data: createdRows[0],
    });
  } catch (error) {
    console.error("Create trip suitcase error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTripSuitcases,
  createTripSuitcase,
};