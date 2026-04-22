const db = require("../config/db");
const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { logTripActivity } = require("../utils/tripActivityLogger");

const createTrip = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tripName,
      destination,
      destinationCity,
      destinationCountry,
      startDate,
      endDate,
      durationDays,
      travelType,
      tripType,
      weatherType,
      travelerCount,
      airlineId,
      packingMode,
      notes,
      status,
    } = req.body;

    if (!tripName && !destinationCity && !destination) {
      return res.status(400).json({
        message: "Trip name or destination is required",
      });
    }

    const query = `
    INSERT INTO trips (
      user_id,
      trip_name,
      destination,
      destination_city,
      destination_country,
      start_date,
      end_date,
      duration_days,
      travel_type,
      trip_type,
      weather_type,
      traveler_count,
      airline_id,
      packing_mode,
      notes,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.query(
      query,
      [
        userId,
        tripName || null,
        destination || `${destinationCity || ""}${destinationCity && destinationCountry ? ", " : ""}${destinationCountry || ""}` || null,
        destinationCity || null,
        destinationCountry || null,
        startDate || null,
        endDate || null,
        durationDays || null,
        travelType || tripType || "casual",
        tripType || travelType || "casual",
        weatherType || "mixed",
        travelerCount || 1,
        airlineId || null,
        packingMode || "balanced",
        notes || null,
        status || "draft",
      ],
      (err, result) => {
        if (err) {
          console.error("Create trip error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }
      
        logTripActivity({
          tripId: result.insertId,
          userId,
          eventType: "trip_created",
          title: "Trip created",
          details: `Created trip "${tripName}"`,
        }).catch((logError) => {
          console.error("Trip activity log error:", logError.message);
        });
      
        return successResponse(
          res,
          "Trip created successfully",
          { tripId: result.insertId },
          201
        );
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

        COALESCE(ts_summary.bags_count, 0) AS bags_count,
        COALESCE(ti_summary.items_count, 0) AS items_count,

        CASE
          WHEN tr.trip_id IS NOT NULL THEN 1
          ELSE 0
        END AS has_results,

        CASE
          WHEN tr.overall_fits = 1 THEN 1
          ELSE 0
        END AS overall_fits,

        COALESCE(ti_summary.checklist_started, 0) AS checklist_started,
        COALESCE(ti_summary.travel_day_configured, 0) AS travel_day_configured

      FROM trips t

      LEFT JOIN (
        SELECT
          trip_id,
          COUNT(*) AS bags_count
        FROM trip_suitcases
        GROUP BY trip_id
      ) ts_summary
        ON ts_summary.trip_id = t.id

      LEFT JOIN (
        SELECT
          trip_id,
          COUNT(*) AS items_count,
          CASE
            WHEN SUM(
              CASE
                WHEN packing_status IS NOT NULL AND packing_status <> 'pending'
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
                WHEN travel_day_mode IS NOT NULL AND travel_day_mode <> 'normal'
                THEN 1
                ELSE 0
              END
            ) > 0
            THEN 1
            ELSE 0
          END AS travel_day_configured
        FROM trip_items
        GROUP BY trip_id
      ) ti_summary
        ON ti_summary.trip_id = t.id

      LEFT JOIN trip_results tr
        ON tr.trip_id = t.id

      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Get trips error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      return successResponse(res, "Trips fetched successfully", results);
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
        return errorResponse(res, "Trip not found", 404);
      }

      return successResponse(res, "Trip fetched successfully", results[0]);
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
      destinationCity,
      destinationCountry,
      startDate,
      endDate,
      durationDays,
      travelType,
      tripType,
      weatherType,
      travelerCount,
      airlineId,
      packingMode,
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
        return errorResponse(res, "Trip not found", 404);
      }

      const updateQuery = `
      UPDATE trips
      SET
        trip_name = ?,
        destination = ?,
        destination_city = ?,
        destination_country = ?,
        start_date = ?,
        end_date = ?,
        duration_days = ?,
        travel_type = ?,
        trip_type = ?,
        weather_type = ?,
        traveler_count = ?,
        airline_id = ?,
        packing_mode = ?,
        notes = ?,
        status = ?
      WHERE id = ? AND user_id = ?
    `;

      db.query(
        updateQuery,
        [
          tripName || null,
          destination || `${destinationCity || ""}${destinationCity && destinationCountry ? ", " : ""}${destinationCountry || ""}` || null,
          destinationCity || null,
          destinationCountry || null,
          startDate || null,
          endDate || null,
          durationDays || null,
          travelType || tripType || "casual",
          tripType || travelType || "casual",
          weatherType || "mixed",
          travelerCount || 1,
          airlineId || null,
          packingMode || "balanced",
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
          return successResponse(res, "Trip updated successfully");
        }
      );
    });
  } catch (error) {
    console.error("Update trip catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
};