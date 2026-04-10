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

const getAirlineBaggageRules = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await queryAsync(
      `
      SELECT *
      FROM airline_baggage_rules
      WHERE airline_id = ?
      ORDER BY bag_type ASC
      `,
      [id]
    );

    return successResponse(res, "Airline baggage rules fetched successfully", rows);
  } catch (error) {
    console.error("Get airline baggage rules error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getAirlines,
  getAirlineBaggageRules,
};