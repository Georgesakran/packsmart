const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const getBagCatalog = async (req, res) => {
  try {
    const rows = await queryAsync(
      `
      SELECT *
      FROM bag_catalog
      WHERE is_active = 1
      ORDER BY bag_type ASC, name ASC
      `
    );

    return successResponse(res, "Bag catalog fetched successfully", rows);
  } catch (error) {
    console.error("Get bag catalog error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getBagCatalog,
};