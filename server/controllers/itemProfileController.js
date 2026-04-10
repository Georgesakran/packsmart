const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const getItemSizeProfiles = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await queryAsync(
      `
      SELECT *
      FROM item_size_profiles
      WHERE item_id = ?
      ORDER BY is_default DESC, size_code ASC
      `,
      [id]
    );

    return successResponse(res, "Item size profiles fetched successfully", rows);
  } catch (error) {
    console.error("Get item size profiles error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getItemFoldProfiles = async (req, res) => {
  try {
    const { id } = req.params;

    const itemRows = await queryAsync(
      `
      SELECT id, category
      FROM items
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (itemRows.length === 0) {
      return errorResponse(res, "Item not found", 404);
    }

    const item = itemRows[0];

    const rows = await queryAsync(
      `
      SELECT *
      FROM fold_profiles
      WHERE item_id = ? OR (item_id IS NULL AND category = ?)
      ORDER BY
        CASE WHEN item_id = ? THEN 0 ELSE 1 END,
        is_default DESC,
        fold_type ASC
      `,
      [id, item.category, id]
    );

    return successResponse(res, "Item fold profiles fetched successfully", rows);
  } catch (error) {
    console.error("Get item fold profiles error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const updateTripItemProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId, tripItemId } = req.params;
    const { sizeCode, foldType } = req.body;

    const tripRows = await queryAsync(
      `
      SELECT id
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [tripId, userId]
    );

    if (tripRows.length === 0) {
      return errorResponse(res, "Trip not found", 404);
    }

    const itemRows = await queryAsync(
      `
      SELECT id
      FROM trip_items
      WHERE id = ? AND trip_id = ?
      LIMIT 1
      `,
      [tripItemId, tripId]
    );

    if (itemRows.length === 0) {
      return errorResponse(res, "Trip item not found", 404);
    }

    await queryAsync(
      `
      UPDATE trip_items
      SET size_code = ?, fold_type = ?
      WHERE id = ? AND trip_id = ?
      `,
      [sizeCode || null, foldType || null, tripItemId, tripId]
    );

    return successResponse(res, "Trip item profile updated successfully");
  } catch (error) {
    console.error("Update trip item profile error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getItemSizeProfiles,
  getItemFoldProfiles,
  updateTripItemProfile,
};