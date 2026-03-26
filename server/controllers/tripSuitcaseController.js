const db = require("../config/db");

const getOwnedTrip = (tripId, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, user_id
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(query, [tripId, userId], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);
      resolve(results[0]);
    });
  });
};

const createTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const {
      suitcaseType,
      name,
      volumeCm3,
      maxWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      isCustom,
    } = req.body;

    if (!name || !volumeCm3 || !maxWeightKg) {
      return res.status(400).json({
        message: "Name, volumeCm3, and maxWeightKg are required",
      });
    }

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const checkQuery = `
      SELECT id
      FROM trip_suitcases
      WHERE trip_id = ?
      LIMIT 1
    `;

    db.query(checkQuery, [tripId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Create trip suitcase check error:", checkErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          message: "This trip already has a suitcase. Use update instead.",
        });
      }

      const insertQuery = `
        INSERT INTO trip_suitcases (
          trip_id,
          suitcase_type,
          name,
          volume_cm3,
          max_weight_kg,
          length_cm,
          width_cm,
          height_cm,
          is_custom
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [
          tripId,
          suitcaseType || "preset",
          name,
          volumeCm3,
          maxWeightKg,
          lengthCm || null,
          widthCm || null,
          heightCm || null,
          isCustom || false,
        ],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Create trip suitcase error:", insertErr.message);
            return res.status(500).json({ message: "Server error" });
          }

          return res.status(201).json({
            message: "Trip suitcase created successfully",
            suitcaseId: result.insertId,
          });
        }
      );
    });
  } catch (error) {
    console.error("Create trip suitcase catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const query = `
      SELECT *
      FROM trip_suitcases
      WHERE trip_id = ?
      LIMIT 1
    `;

    db.query(query, [tripId], (err, results) => {
      if (err) {
        console.error("Get trip suitcase error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Suitcase not found for this trip",
        });
      }

      return res.status(200).json(results[0]);
    });
  } catch (error) {
    console.error("Get trip suitcase catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const {
      suitcaseType,
      name,
      volumeCm3,
      maxWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      isCustom,
    } = req.body;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const updateQuery = `
      UPDATE trip_suitcases
      SET
        suitcase_type = ?,
        name = ?,
        volume_cm3 = ?,
        max_weight_kg = ?,
        length_cm = ?,
        width_cm = ?,
        height_cm = ?,
        is_custom = ?
      WHERE trip_id = ?
    `;

    db.query(
      updateQuery,
      [
        suitcaseType || "preset",
        name,
        volumeCm3,
        maxWeightKg,
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        isCustom || false,
        tripId,
      ],
      (err, result) => {
        if (err) {
          console.error("Update trip suitcase error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Suitcase not found for this trip",
          });
        }

        return res.status(200).json({
          message: "Trip suitcase updated successfully",
        });
      }
    );
  } catch (error) {
    console.error("Update trip suitcase catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTripSuitcase,
  getTripSuitcase,
  updateTripSuitcase,
};