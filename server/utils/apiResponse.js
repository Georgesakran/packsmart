const successResponse = (res, message = "Success", data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = "Server error", status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};