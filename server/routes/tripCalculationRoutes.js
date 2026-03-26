const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  calculateTrip,
  getTripResults,
} = require("../controllers/tripCalculationController");

router.post("/:tripId/calculate", protect, calculateTrip);
router.get("/:tripId/results", protect, getTripResults);

module.exports = router;