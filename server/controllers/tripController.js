const db = require("../config/db");

const createTrip = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tripName,
      destination,
      startDate,
      endDate,
      durationDays,
      travelType,
      weatherType,
      travelerCount,
      notes,
      status,
    } = req.body;

    if (!tripName) {
      return res.status(400).json({
        message: "Trip name is required",
      });
    }

    const query = `
      INSERT INTO trips (
        user_id,
        trip_name,
        destination,
        start_date,
        end_date,
        duration_days,
        travel_type,
        weather_type,
        traveler_count,
        notes,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        userId,
        tripName,
        destination || null,
        startDate || null,
        endDate || null,
        durationDays || null,
        travelType || "casual",
        weatherType || "mixed",
        travelerCount || 1,
        notes || null,
        status || "draft",
      ],
      (err, result) => {
        if (err) {
          console.error("Create trip error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        return res.status(201).json({
          message: "Trip created successfully",
          tripId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Create trip catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTrips = (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        t.*,

        COUNT(DISTINCT ts.id) AS bags_count,
        COUNT(DISTINCT ti.id) AS items_count,

        CASE
          WHEN tr.trip_id IS NOT NULL THEN 1
          ELSE 0
        END AS has_results,

        CASE
          WHEN tr.overall_fits = 1 THEN 1
          ELSE 0
        END AS overall_fits,

        CASE
          WHEN SUM(
            CASE
              WHEN ti.packing_status IS NOT NULL AND ti.packing_status <> 'pending'
              THEN 1
              ELSE 0
            END
          ) > 0
          THEN 1
          ELSE 0
        END AS checklist_started,

        CASE
          WHEN SUM(
            CASE
              WHEN ti.travel_day_mode IS NOT NULL AND ti.travel_day_mode <> 'normal'
              THEN 1
              ELSE 0
            END
          ) > 0
          THEN 1
          ELSE 0
        END AS travel_day_configured

      FROM trips t
      LEFT JOIN trip_suitcases ts ON ts.trip_id = t.id
      LEFT JOIN trip_items ti ON ti.trip_id = t.id
      LEFT JOIN trip_results tr ON tr.trip_id = t.id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Get trips error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error("Get trips catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTripById = (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const query = `
      SELECT *
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(query, [tripId, userId], (err, results) => {
      if (err) {
        console.error("Get trip by id error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }

      return res.status(200).json(results[0]);
    });
  } catch (error) {
    console.error("Get trip by id catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateTrip = (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;
    const {
      tripName,
      destination,
      startDate,
      endDate,
      durationDays,
      travelType,
      weatherType,
      travelerCount,
      notes,
      status,
    } = req.body;

    const checkQuery = `
      SELECT id
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(checkQuery, [tripId, userId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Update trip check error:", checkErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }

      const updateQuery = `
        UPDATE trips
        SET
          trip_name = ?,
          destination = ?,
          start_date = ?,
          end_date = ?,
          duration_days = ?,
          travel_type = ?,
          weather_type = ?,
          traveler_count = ?,
          notes = ?,
          status = ?
        WHERE id = ? AND user_id = ?
      `;

      db.query(
        updateQuery,
        [
          tripName,
          destination || null,
          startDate || null,
          endDate || null,
          durationDays || null,
          travelType || "casual",
          weatherType || "mixed",
          travelerCount || 1,
          notes || null,
          status || "draft",
          tripId,
          userId,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error("Update trip error:", updateErr.message);
            return res.status(500).json({ message: "Server error" });
          }

          return res.status(200).json({
            message: "Trip updated successfully",
          });
        }
      );
    });
  } catch (error) {
    console.error("Update trip catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteTrip = (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const query = `
      DELETE FROM trips
      WHERE id = ? AND user_id = ?
    `;

    db.query(query, [tripId, userId], (err, result) => {
      if (err) {
        console.error("Delete trip error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Trip not found",
        });
      }

      return res.status(200).json({
        message: "Trip deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete trip catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};


const duplicateTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const tripId = id;

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
      return res.status(404).json({ message: "Trip not found" });
    }

    const originalTrip = tripRows[0];

    const tripInsertResult = await queryAsync(
      `
      INSERT INTO trips (
        user_id,
        trip_name,
        destination,
        start_date,
        end_date,
        duration_days,
        travel_type,
        weather_type,
        traveler_count,
        status,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        `${originalTrip.trip_name} Copy`,
        originalTrip.destination,
        originalTrip.start_date,
        originalTrip.end_date,
        originalTrip.duration_days,
        originalTrip.travel_type,
        originalTrip.weather_type,
        originalTrip.traveler_count,
        "draft",
        originalTrip.notes || null,
      ]
    );

    const newTripId = tripInsertResult.insertId;

    const oldBags = await queryAsync(
      `
      SELECT *
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY id ASC
      `,
      [tripId]
    );

    const bagIdMap = {};

    for (const bag of oldBags) {
      const insertedBag = await queryAsync(
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
          newTripId,
          bag.suitcase_type,
          bag.name,
          bag.volume_cm3,
          bag.max_weight_kg,
          bag.length_cm,
          bag.width_cm,
          bag.height_cm,
          bag.is_custom,
          bag.bag_role,
          bag.is_primary,
        ]
      );

      bagIdMap[bag.id] = insertedBag.insertId;
    }

    const oldItems = await queryAsync(
      `
      SELECT *
      FROM trip_items
      WHERE trip_id = ?
      ORDER BY id ASC
      `,
      [tripId]
    );

    for (const item of oldItems) {
      await queryAsync(
        `
        INSERT INTO trip_items (
          trip_id,
          item_id,
          custom_name,
          source_type,
          quantity,
          category,
          audience,
          size_code,
          pack_behavior,
          base_volume_cm3,
          base_weight_g,
          assigned_bag_id,
          packing_status,
          travel_day_mode,
          priority,
          remove_priority
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          newTripId,
          item.item_id,
          item.custom_name,
          item.source_type,
          item.quantity,
          item.category,
          item.audience,
          item.size_code,
          item.pack_behavior,
          item.base_volume_cm3,
          item.base_weight_g,
          item.assigned_bag_id ? bagIdMap[item.assigned_bag_id] || null : null,
          "pending",
          "normal",
          item.priority || "recommended",
          item.remove_priority || "medium",
        ]
      );
    }

    return res.status(201).json({
      message: "Trip duplicated successfully",
      newTripId,
    });
  } catch (error) {
    console.error("Duplicate trip error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const archiveTrip = (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    console.log("archiveTrip called with:", { id, userId });

    const query = `
      UPDATE trips
      SET status = 'archived'
      WHERE id = ? AND user_id = ?
    `;

    db.query(query, [id, userId], (err, result) => {
      if (err) {
        console.error("Archive trip SQL error:", err);
        return res.status(500).json({
          message: "Archive trip SQL error",
          sqlMessage: err.message,
        });
      }

      console.log("Archive trip result:", result);

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      return res.status(200).json({ message: "Trip archived successfully" });
    });
  } catch (error) {
    console.error("Archive trip catch error:", error);
    return res.status(500).json({
      message: "Archive trip catch error",
      error: error.message,
    });
  }
};

const unarchiveTrip = (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    console.log("unarchiveTrip called with:", { id, userId });

    const query = `
      UPDATE trips
      SET status = 'draft'
      WHERE id = ? AND user_id = ?
    `;

    db.query(query, [id, userId], (err, result) => {
      if (err) {
        console.error("Unarchive trip SQL error:", err);
        return res.status(500).json({
          message: "Unarchive trip SQL error",
          sqlMessage: err.message,
        });
      }

      console.log("Unarchive trip result:", result);

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      return res.status(200).json({ message: "Trip restored successfully" });
    });
  } catch (error) {
    console.error("Unarchive trip catch error:", error);
    return res.status(500).json({
      message: "Unarchive trip catch error",
      error: error.message,
    });
  }
};

const bulkDeleteTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripIds } = req.body;

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({ message: "tripIds array is required" });
    }

    for (const tripId of tripIds) {
      await queryAsync(`DELETE FROM trip_results WHERE trip_id = ?`, [tripId]);
      await queryAsync(`DELETE FROM trip_items WHERE trip_id = ?`, [tripId]);
      await queryAsync(`DELETE FROM trip_suitcases WHERE trip_id = ?`, [tripId]);
      await queryAsync(`DELETE FROM trips WHERE id = ? AND user_id = ?`, [tripId, userId]);
    }

    return res.status(200).json({
      message: "Selected trips deleted successfully",
    });
  } catch (error) {
    console.error("Bulk delete trips error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const bulkArchiveTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripIds } = req.body;

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({ message: "tripIds array is required" });
    }

    const placeholders = tripIds.map(() => "?").join(",");

    await queryAsync(
      `
      UPDATE trips
      SET status = 'archived'
      WHERE user_id = ? AND id IN (${placeholders})
      `,
      [userId, ...tripIds]
    );

    return res.status(200).json({
      message: "Selected trips archived successfully",
    });
  } catch (error) {
    console.error("Bulk archive trips error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const bulkUnarchiveTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripIds } = req.body;

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({ message: "tripIds array is required" });
    }

    const placeholders = tripIds.map(() => "?").join(",");

    await queryAsync(
      `
      UPDATE trips
      SET status = 'draft'
      WHERE user_id = ? AND id IN (${placeholders})
      `,
      [userId, ...tripIds]
    );

    return res.status(200).json({
      message: "Selected trips restored successfully",
    });
  } catch (error) {
    console.error("Bulk unarchive trips error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  archiveTrip,
  unarchiveTrip,
  bulkDeleteTrips,
  bulkArchiveTrips,
  bulkUnarchiveTrips,
};