const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTripSuitcase,
  getTripSuitcase,
  updateTripSuitcase,
} = require("../controllers/tripSuitcaseController");

router.post("/:tripId/suitcase", protect, createTripSuitcase);
router.get("/:tripId/suitcase", protect, getTripSuitcase);
router.put("/:tripId/suitcase", protect, updateTripSuitcase);

module.exports = router;