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

const getTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const results = await queryAsync(
      `
      SELECT *
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
      `,
      [tripId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "No suitcase found for this trip" });
    }

    return res.status(200).json(results[0]);
  } catch (error) {
    console.error("Get trip suitcase error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const createTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
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

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (!name || !volumeCm3 || !maxWeightKg) {
      return res.status(400).json({
        message: "Name, volume, and max weight are required",
      });
    }

    const existing = await queryAsync(
      `SELECT id FROM trip_suitcases WHERE trip_id = ? LIMIT 1`,
      [tripId]
    );

    const shouldBePrimary = typeof isPrimary === "boolean" ? isPrimary : existing.length === 0;

    if (shouldBePrimary) {
      await queryAsync(
        `UPDATE trip_suitcases SET is_primary = 0 WHERE trip_id = ?`,
        [tripId]
      );
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
        suitcaseType || "preset",
        name,
        volumeCm3,
        maxWeightKg,
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        !!isCustom,
        bagRole || "main",
        shouldBePrimary ? 1 : 0,
      ]
    );

    return res.status(201).json({
      message: "Trip suitcase created successfully",
      suitcaseId: result.insertId,
    });
  } catch (error) {
    console.error("Create trip suitcase error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateTripSuitcase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
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

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const existing = await queryAsync(
      `
      SELECT *
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
      `,
      [tripId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "No suitcase found for this trip" });
    }

    const suitcaseId = existing[0].id;
    const shouldBePrimary = typeof isPrimary === "boolean" ? isPrimary : true;

    if (shouldBePrimary) {
      await queryAsync(
        `UPDATE trip_suitcases SET is_primary = 0 WHERE trip_id = ?`,
        [tripId]
      );
    }

    await queryAsync(
      `
      UPDATE trip_suitcases
      SET
        suitcase_type = ?,
        name = ?,
        volume_cm3 = ?,
        max_weight_kg = ?,
        length_cm = ?,
        width_cm = ?,
        height_cm = ?,
        is_custom = ?,
        bag_role = ?,
        is_primary = ?
      WHERE id = ? AND trip_id = ?
      `,
      [
        suitcaseType || "preset",
        name,
        volumeCm3,
        maxWeightKg,
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        !!isCustom,
        bagRole || existing[0].bag_role || "main",
        shouldBePrimary ? 1 : 0,
        suitcaseId,
        tripId,
      ]
    );

    return res.status(200).json({
      message: "Trip suitcase updated successfully",
    });
  } catch (error) {
    console.error("Update trip suitcase error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

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

const createTripSuitcaseByList = async (req, res) => {
  return createTripSuitcase(req, res);
};

const updateTripSuitcaseById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId, suitcaseId } = req.params;
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

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (isPrimary) {
      await queryAsync(
        `UPDATE trip_suitcases SET is_primary = 0 WHERE trip_id = ?`,
        [tripId]
      );
    }

    const result = await queryAsync(
      `
      UPDATE trip_suitcases
      SET
        suitcase_type = ?,
        name = ?,
        volume_cm3 = ?,
        max_weight_kg = ?,
        length_cm = ?,
        width_cm = ?,
        height_cm = ?,
        is_custom = ?,
        bag_role = ?,
        is_primary = ?
      WHERE id = ? AND trip_id = ?
      `,
      [
        suitcaseType || "preset",
        name,
        volumeCm3,
        maxWeightKg,
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        !!isCustom,
        bagRole || "main",
        isPrimary ? 1 : 0,
        suitcaseId,
        tripId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Trip suitcase not found" });
    }

    return res.status(200).json({
      message: "Trip suitcase updated successfully",
    });
  } catch (error) {
    console.error("Update trip suitcase by id error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteTripSuitcaseById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId, suitcaseId } = req.params;

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const existing = await queryAsync(
      `SELECT * FROM trip_suitcases WHERE id = ? AND trip_id = ? LIMIT 1`,
      [suitcaseId, tripId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Trip suitcase not found" });
    }

    await queryAsync(
      `DELETE FROM trip_suitcases WHERE id = ? AND trip_id = ?`,
      [suitcaseId, tripId]
    );

    if (existing[0].is_primary) {
      const remaining = await queryAsync(
        `
        SELECT id
        FROM trip_suitcases
        WHERE trip_id = ?
        ORDER BY created_at ASC
        LIMIT 1
        `,
        [tripId]
      );

      if (remaining.length > 0) {
        await queryAsync(
          `UPDATE trip_suitcases SET is_primary = 1 WHERE id = ?`,
          [remaining[0].id]
        );
      }
    }

    return res.status(200).json({
      message: "Trip suitcase deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip suitcase error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTripSuitcase,
  createTripSuitcase,
  updateTripSuitcase,
  getTripSuitcases,
  createTripSuitcaseByList,
  updateTripSuitcaseById,
  deleteTripSuitcaseById,
};