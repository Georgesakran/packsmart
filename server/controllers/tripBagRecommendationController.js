const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { buildBagRecommendations } = require("../services/bagRecommendationEngine");

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

const recommendBagsForTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const bags = await queryAsync(
      `
      SELECT *
      FROM bag_catalog
      WHERE is_active = 1
      ORDER BY bag_type ASC, name ASC
      `
    );

    const airlineRules = trip.airline_id
      ? await queryAsync(
          `
          SELECT *
          FROM airline_baggage_rules
          WHERE airline_id = ?
          `,
          [trip.airline_id]
        )
      : [];

    const recommendation = buildBagRecommendations(trip, bags, airlineRules);

    return successResponse(
      res,
      "Bag recommendations fetched successfully",
      recommendation
    );
  } catch (error) {
    console.error("Recommend bags for trip error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const saveSelectedTripBags = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { selectedBags = [] } = req.body;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    if (!Array.isArray(selectedBags) || selectedBags.length === 0) {
      return errorResponse(res, "selectedBags array is required", 400);
    }

    await queryAsync(`DELETE FROM trip_selected_bags WHERE trip_id = ?`, [id]);

    for (const bag of selectedBags) {
      await queryAsync(
        `
        INSERT INTO trip_selected_bags (
          trip_id,
          bag_catalog_id,
          quantity,
          role_label,
          is_recommended
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          id,
          bag.bagCatalogId,
          bag.quantity || 1,
          bag.roleLabel || null,
          bag.isRecommended ? 1 : 0,
        ]
      );
    }

    return successResponse(res, "Selected trip bags saved successfully");
  } catch (error) {
    console.error("Save selected trip bags error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getSelectedTripBags = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const rows = await queryAsync(
      `
      SELECT
        tsb.*,
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

    return successResponse(res, "Selected trip bags fetched successfully", rows);
  } catch (error) {
    console.error("Get selected trip bags error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  recommendBagsForTrip,
  saveSelectedTripBags,
  getSelectedTripBags,
};