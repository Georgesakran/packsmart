const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { calculatePackingResult } = require("../services/packingCalculationEngine");
const { logTripActivity } = require("../utils/tripActivityLogger");

const getOwnedTrip = async (tripId, userId) => {
  const rows = await queryAsync(
    `
    SELECT *
    FROM trips
    WHERE id = ? AND user_id = ?
    LIMIT 1
    `,
    [tripId, userId]
  );

  return rows[0] || null;
};

const calculateTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const selectedBags = await queryAsync(
      `
      SELECT
        tsb.id,
        tsb.trip_id,
        tsb.bag_catalog_id,
        tsb.quantity,
        tsb.role_label,
        tsb.is_recommended,
        bc.name,
        bc.brand,
        bc.bag_type,
        bc.length_cm,
        bc.width_cm,
        bc.height_cm,
        bc.volume_cm3,
        bc.empty_weight_kg,
        bc.max_weight_kg
      FROM trip_selected_bags tsb
      JOIN bag_catalog bc ON tsb.bag_catalog_id = bc.id
      WHERE tsb.trip_id = ?
      ORDER BY tsb.created_at ASC
      `,
      [id]
    );

    const tripItems = await queryAsync(
      `
      SELECT
        ti.*,
        i.name AS base_item_name
      FROM trip_items ti
      LEFT JOIN items i ON ti.item_id = i.id
      WHERE ti.trip_id = ?
      ORDER BY ti.created_at ASC
      `,
      [id]
    );

    const result = calculatePackingResult({
      trip,
      selectedBags,
      tripItems,
    });

    const existingRows = await queryAsync(
      `
      SELECT id
      FROM trip_results
      WHERE trip_id = ?
      LIMIT 1
      `,
      [id]
    );

    const values = [
      result.overallFits ? 1 : 0,
      result.totalAvailableVolumeCm3,
      result.totalUsedVolumeCm3,
      result.totalFreeVolumeCm3,
      result.totalAvailableWeightG,
      result.totalUsedWeightG,
      result.totalFreeWeightG,
      result.overflowItemCount,
      result.wornOnTravelDayCount,
      JSON.stringify(result.warnings || []),
      JSON.stringify(result.overflowItems || []),
      JSON.stringify(result.bagResults || []),
      JSON.stringify(result.travelDay || {}),
      JSON.stringify(result.fixSuggestions || []),
    ];

    if (existingRows.length > 0) {
      await queryAsync(
        `
        UPDATE trip_results
        SET
          overall_fits = ?,
          total_available_volume_cm3 = ?,
          total_used_volume_cm3 = ?,
          total_free_volume_cm3 = ?,
          total_available_weight_g = ?,
          total_used_weight_g = ?,
          total_free_weight_g = ?,
          overflow_item_count = ?,
          worn_on_travel_day_count = ?,
          warnings_json = ?,
          overflow_json = ?,
          bag_results_json = ?,
          travel_day_json = ?,
          fix_suggestions_json = ?
        WHERE trip_id = ?
        `,
        [...values, id]
      );
    } else {
      await queryAsync(
        `
        INSERT INTO trip_results (
          trip_id,
          overall_fits,
          total_available_volume_cm3,
          total_used_volume_cm3,
          total_free_volume_cm3,
          total_available_weight_g,
          total_used_weight_g,
          total_free_weight_g,
          overflow_item_count,
          worn_on_travel_day_count,
          warnings_json,
          overflow_json,
          bag_results_json,
          travel_day_json,
          fix_suggestions_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [id, ...values]
      );
    }

    await logTripActivity({
      tripId: id,
      userId,
      eventType: "trip_calculated",
      title: "Trip calculated",
      details: result.overallFits
        ? "Trip calculation completed and the current setup fits."
        : "Trip calculation completed and the current setup needs adjustment.",
    });

    return successResponse(res, "Trip calculated successfully", result);
  } catch (error) {
    console.error("Calculate trip error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getTripResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const rows = await queryAsync(
      `
      SELECT *
      FROM trip_results
      WHERE trip_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return successResponse(res, "Trip results fetched successfully", null);
    }

    const raw = rows[0];

    const result = {
      ...raw,
      overallFits: Number(raw.overall_fits) === 1,
      totalAvailableVolumeCm3: Number(raw.total_available_volume_cm3 || 0),
      totalUsedVolumeCm3: Number(raw.total_used_volume_cm3 || 0),
      totalFreeVolumeCm3: Number(raw.total_free_volume_cm3 || 0),
      totalAvailableWeightG: Number(raw.total_available_weight_g || 0),
      totalUsedWeightG: Number(raw.total_used_weight_g || 0),
      totalFreeWeightG: Number(raw.total_free_weight_g || 0),
      overflowItemCount: Number(raw.overflow_item_count || 0),
      wornOnTravelDayCount: Number(raw.worn_on_travel_day_count || 0),
      warnings: raw.warnings_json ? JSON.parse(raw.warnings_json) : [],
      overflowItems: raw.overflow_json ? JSON.parse(raw.overflow_json) : [],
      bagResults: raw.bag_results_json ? JSON.parse(raw.bag_results_json) : [],
      travelDay: raw.travel_day_json ? JSON.parse(raw.travel_day_json) : {},
      fixSuggestions: raw.fix_suggestions_json
        ? JSON.parse(raw.fix_suggestions_json)
        : [],
    };

    return successResponse(res, "Trip results fetched successfully", result);
  } catch (error) {
    console.error("Get trip results error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  calculateTrip,
  getTripResults,
};