const { errorResponse } = require("../utils/apiResponse");

const errorMiddleware = (err, req, res, next) => {
  console.error("Unhandled server error:", err);
  return errorResponse(res, err.message || "Server error", 500);
};

module.exports = errorMiddleware;