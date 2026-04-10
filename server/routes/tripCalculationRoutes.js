const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  calculateTrip,
  getTripResults,
} = require("../controllers/tripCalculationController");

router.post("/:id/calculate", protect, calculateTrip);
router.get("/:id/results", protect, getTripResults);

module.exports = router;