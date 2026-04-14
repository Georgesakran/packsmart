const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const safeJsonParse = (value, fallback) => {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const getTripSimulationScene = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tripRows = await queryAsync(
      `
      SELECT id
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (tripRows.length === 0) {
      return errorResponse(res, "Trip not found", 404);
    }

    const rows = await queryAsync(
      `
      SELECT
        simulation_scene_json,
        simulation_scene_version,
        simulation_generated_at
      FROM trip_results
      WHERE trip_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0 || !rows[0].simulation_scene_json) {
      return successResponse(
        res,
        "Simulation scene fetched successfully",
        null
      );
    }

    return successResponse(res, "Simulation scene fetched successfully", {
      sceneVersion: Number(rows[0].simulation_scene_version || 0) || 1,
      generatedAt: rows[0].simulation_generated_at || null,
      scene: safeJsonParse(rows[0].simulation_scene_json, null),
    });
  } catch (error) {
    console.error("Get trip simulation scene error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getTripSimulationScene,
};