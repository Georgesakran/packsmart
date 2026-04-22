const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTripSuitcases,
  createTripSuitcase,
} = require("../controllers/tripSuitcaseController");

router.get("/:tripId/suitcases", protect, getTripSuitcases);
router.post("/:tripId/suitcases", protect, createTripSuitcase);

module.exports = router;