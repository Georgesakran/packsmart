const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { buildSuggestedItems } = require("../services/itemSuggestionEngine");
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

const getSuggestedItemsForTrip = async (req, res) => {
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
        bag_role AS bag_type,
        volume_cm3,
        max_weight_kg,
        length_cm,
        width_cm,
        height_cm,
        is_primary
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC, id ASC
      `,
      [id]
    );

    const catalogRows = await queryAsync(
      `
      SELECT *
      FROM items
      ORDER BY name ASC
      `
    );

    const catalogMap = {};
    catalogRows.forEach((item) => {
      catalogMap[item.name] = item;
    });

    const result = buildSuggestedItems({
      trip,
      selectedBags,
      catalogMap,
    });

    return successResponse(
      res,
      "Suggested items generated successfully",
      result
    );
  } catch (error) {
    console.error("Get suggested items for trip error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const applySuggestedItemsToTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { items = [], replaceExisting = true } = req.body;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, "items array is required", 400);
    }

    if (replaceExisting) {
      await queryAsync(`DELETE FROM trip_items WHERE trip_id = ?`, [id]);
    }

    for (const item of items) {
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
          base_weight_g
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          item.itemId || null,
          item.customName || null,
          item.sourceType || "database",
          item.quantity || 1,
          item.category || null,
          item.audience || "unisex",
          item.sizeCode || null,
          item.packBehavior,
          item.baseVolumeCm3,
          item.baseWeightG,
        ]
      );
    }

    await logTripActivity({
      tripId: id,
      userId,
      eventType: "suggestions_generated",
      title: "Suggested items applied",
      details: `${items.length} suggested item${items.length === 1 ? "" : "s"} were added to this trip.`,
    });

    return successResponse(res, "Suggested items applied successfully");
  } catch (error) {
    console.error("Apply suggested items to trip error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getSuggestedItemsForTrip,
  applySuggestedItemsToTrip,
};