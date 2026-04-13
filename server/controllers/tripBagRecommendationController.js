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

    await queryAsync(`DELETE FROM trip_suitcases WHERE trip_id = ?`, [id]);

    let primaryAssigned = false;

    for (const bag of selectedBags) {
      const bagCatalogRows = await queryAsync(
        `
        SELECT *
        FROM bag_catalog
        WHERE id = ?
        LIMIT 1
        `,
        [bag.bagCatalogId]
      );

      if (bagCatalogRows.length === 0) {
        continue;
      }

      const catalogBag = bagCatalogRows[0];
      const quantity = Number(bag.quantity || 1);

      for (let i = 0; i < quantity; i += 1) {
        const isPrimary = primaryAssigned ? 0 : 1;

        await queryAsync(
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
            id,
            "preset",
            catalogBag.name,
            catalogBag.volume_cm3 || 0,
            catalogBag.max_weight_kg || 0,
            catalogBag.length_cm || null,
            catalogBag.width_cm || null,
            catalogBag.height_cm || null,
            0,
            bag.roleLabel || catalogBag.bag_type || "main",
            isPrimary,
          ]
        );

        if (!primaryAssigned) {
          primaryAssigned = true;
        }
      }
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
        id,
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
        is_primary,
        created_at
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC, id ASC
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