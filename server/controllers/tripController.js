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

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};