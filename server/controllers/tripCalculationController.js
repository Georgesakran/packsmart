const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { calculatePackingResult } = require("../services/packingCalculationEngine");
const { logTripActivity } = require("../utils/tripActivityLogger");
const { resolveTripItemPackingProfile } = require("../services/packingProfileResolver");
const { buildVisualPackingPlan } = require("../services/packingPlacementEngine");
const { buildPackingScene } = require("../services/packingSceneEngine");

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
        id,
        trip_id,
        name,
        suitcase_type,
        bag_role AS role_label,
        bag_role AS bag_type,
        length_cm,
        width_cm,
        height_cm,
        volume_cm3,
        max_weight_kg,
        is_primary,
        created_at
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC, id ASC
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

    const resolvedTripItems = [];
    for (const item of tripItems) {
      const resolved = await resolveTripItemPackingProfile(item);
      resolvedTripItems.push(resolved);
    }
    
    const result = calculatePackingResult({
      trip,
      selectedBags,
      tripItems: resolvedTripItems,
    });

    const visualPackingPlan = buildVisualPackingPlan({
      selectedBags,
      calculationResult: result,
    });

    const packingScene = buildPackingScene({
      visualPackingPlan,
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
      JSON.stringify(visualPackingPlan || null),
      JSON.stringify(packingScene || null),
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
          fix_suggestions_json = ?,
          visual_packing_plan_json = ?,
          packing_scene_json = ?
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
          fix_suggestions_json,
          visual_packing_plan_json,
          packing_scene_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      visualPackingPlan: raw.visual_packing_plan_json
        ? JSON.parse(raw.visual_packing_plan_json)
        : null,
      packingScene: raw.packing_scene_json
        ? JSON.parse(raw.packing_scene_json)
        : null,
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