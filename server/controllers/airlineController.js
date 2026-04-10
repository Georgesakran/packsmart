const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const getAirlines = async (req, res) => {
  try {
    const rows = await queryAsync(
      `
      SELECT id, name, code
      FROM airlines
      WHERE is_active = 1
      ORDER BY name ASC
      `
    );

    return successResponse(res, "Airlines fetched successfully", rows);
  } catch (error) {
    console.error("Get airlines error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getAirlines,
};