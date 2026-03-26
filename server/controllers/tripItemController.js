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

const createTripItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const {
      itemId,
      customName,
      sourceType,
      quantity,
      sizeCode,
      category,
      audience,
      baseVolumeCm3,
      baseWeightG,
      packBehavior,
    } = req.body;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    if (!sourceType || !quantity || !baseVolumeCm3 || !baseWeightG || !packBehavior) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (sourceType === "database" && !itemId) {
      return res.status(400).json({
        message: "itemId is required for database items",
      });
    }

    if (sourceType === "custom" && !customName) {
      return res.status(400).json({
        message: "customName is required for custom items",
      });
    }

    const query = `
      INSERT INTO trip_items (
        trip_id,
        item_id,
        custom_name,
        source_type,
        quantity,
        size_code,
        category,
        audience,
        base_volume_cm3,
        base_weight_g,
        pack_behavior
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        tripId,
        itemId || null,
        customName || null,
        sourceType,
        quantity,
        sizeCode || null,
        category || null,
        audience || null,
        baseVolumeCm3,
        baseWeightG,
        packBehavior,
      ],
      (err, result) => {
        if (err) {
          console.error("Create trip item error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        return res.status(201).json({
          message: "Trip item created successfully",
          tripItemId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Create trip item catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTripItems = async (req, res) => {
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
      FROM trip_items
      WHERE trip_id = ?
      ORDER BY created_at ASC
    `;

    db.query(query, [tripId], (err, results) => {
      if (err) {
        console.error("Get trip items error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error("Get trip items catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateTripItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const tripItemId = req.params.tripItemId;

    const {
      itemId,
      customName,
      sourceType,
      quantity,
      sizeCode,
      category,
      audience,
      baseVolumeCm3,
      baseWeightG,
      packBehavior,
    } = req.body;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const query = `
      UPDATE trip_items
      SET
        item_id = ?,
        custom_name = ?,
        source_type = ?,
        quantity = ?,
        size_code = ?,
        category = ?,
        audience = ?,
        base_volume_cm3 = ?,
        base_weight_g = ?,
        pack_behavior = ?
      WHERE id = ? AND trip_id = ?
    `;

    db.query(
      query,
      [
        itemId || null,
        customName || null,
        sourceType,
        quantity,
        sizeCode || null,
        category || null,
        audience || null,
        baseVolumeCm3,
        baseWeightG,
        packBehavior,
        tripItemId,
        tripId,
      ],
      (err, result) => {
        if (err) {
          console.error("Update trip item error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Trip item not found",
          });
        }

        return res.status(200).json({
          message: "Trip item updated successfully",
        });
      }
    );
  } catch (error) {
    console.error("Update trip item catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteTripItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const tripItemId = req.params.tripItemId;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const query = `
      DELETE FROM trip_items
      WHERE id = ? AND trip_id = ?
    `;

    db.query(query, [tripItemId, tripId], (err, result) => {
      if (err) {
        console.error("Delete trip item error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Trip item not found",
        });
      }

      return res.status(200).json({
        message: "Trip item deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete trip item catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTripItem,
  getTripItems,
  updateTripItem,
  deleteTripItem,
};