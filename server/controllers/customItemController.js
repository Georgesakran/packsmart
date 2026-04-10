const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const calculateVolume = (lengthCm, widthCm, heightCm, providedVolume) => {
  if (providedVolume != null && Number(providedVolume) > 0) {
    return Number(providedVolume);
  }

  const l = Number(lengthCm || 0);
  const w = Number(widthCm || 0);
  const h = Number(heightCm || 0);

  if (l > 0 && w > 0 && h > 0) {
    return l * w * h;
  }

  return 0;
};

const getCustomItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await queryAsync(
      `
      SELECT *
      FROM user_custom_items
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return successResponse(res, "Custom items fetched successfully", rows);
  } catch (error) {
    console.error("Get custom items error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getCustomItemById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const rows = await queryAsync(
      `
      SELECT *
      FROM user_custom_items
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (rows.length === 0) {
      return errorResponse(res, "Custom item not found", 404);
    }

    return successResponse(res, "Custom item fetched successfully", rows[0]);
  } catch (error) {
    console.error("Get custom item by id error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const createCustomItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category,
      audience,
      lengthCm,
      widthCm,
      heightCm,
      baseVolumeCm3,
      baseWeightG,
      packBehavior,
      notes,
      imageUrl,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, "Custom item name is required", 400);
    }

    if (!packBehavior) {
      return errorResponse(res, "Pack behavior is required", 400);
    }

    if (!baseWeightG || Number(baseWeightG) <= 0) {
      return errorResponse(res, "Base weight must be greater than 0", 400);
    }

    const volume = calculateVolume(lengthCm, widthCm, heightCm, baseVolumeCm3);

    if (!volume || volume <= 0) {
      return errorResponse(
        res,
        "Valid dimensions or base volume are required",
        400
      );
    }

    const result = await queryAsync(
      `
      INSERT INTO user_custom_items (
        user_id,
        name,
        category,
        audience,
        length_cm,
        width_cm,
        height_cm,
        base_volume_cm3,
        base_weight_g,
        pack_behavior,
        notes,
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name.trim(),
        category || "misc",
        audience || "unisex",
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        volume,
        baseWeightG,
        packBehavior,
        notes || null,
        imageUrl || null,
      ]
    );

    return successResponse(
      res,
      "Custom item created successfully",
      { customItemId: result.insertId },
      201
    );
  } catch (error) {
    console.error("Create custom item error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const updateCustomItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      category,
      audience,
      lengthCm,
      widthCm,
      heightCm,
      baseVolumeCm3,
      baseWeightG,
      packBehavior,
      notes,
      imageUrl,
    } = req.body;

    const existingRows = await queryAsync(
      `
      SELECT id
      FROM user_custom_items
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (existingRows.length === 0) {
      return errorResponse(res, "Custom item not found", 404);
    }

    if (!name || !name.trim()) {
      return errorResponse(res, "Custom item name is required", 400);
    }

    if (!packBehavior) {
      return errorResponse(res, "Pack behavior is required", 400);
    }

    if (!baseWeightG || Number(baseWeightG) <= 0) {
      return errorResponse(res, "Base weight must be greater than 0", 400);
    }

    const volume = calculateVolume(lengthCm, widthCm, heightCm, baseVolumeCm3);

    if (!volume || volume <= 0) {
      return errorResponse(
        res,
        "Valid dimensions or base volume are required",
        400
      );
    }

    await queryAsync(
      `
      UPDATE user_custom_items
      SET
        name = ?,
        category = ?,
        audience = ?,
        length_cm = ?,
        width_cm = ?,
        height_cm = ?,
        base_volume_cm3 = ?,
        base_weight_g = ?,
        pack_behavior = ?,
        notes = ?,
        image_url = ?
      WHERE id = ? AND user_id = ?
      `,
      [
        name.trim(),
        category || "misc",
        audience || "unisex",
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        volume,
        baseWeightG,
        packBehavior,
        notes || null,
        imageUrl || null,
        id,
        userId,
      ]
    );

    return successResponse(res, "Custom item updated successfully");
  } catch (error) {
    console.error("Update custom item error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const deleteCustomItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await queryAsync(
      `
      DELETE FROM user_custom_items
      WHERE id = ? AND user_id = ?
      `,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, "Custom item not found", 404);
    }

    return successResponse(res, "Custom item deleted successfully");
  } catch (error) {
    console.error("Delete custom item error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getCustomItems,
  getCustomItemById,
  createCustomItem,
  updateCustomItem,
  deleteCustomItem,
};