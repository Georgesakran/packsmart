const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTripSuitcase,
  createTripSuitcase,
  updateTripSuitcase,
  getTripSuitcases,
  createTripSuitcaseByList,
  updateTripSuitcaseById,
  deleteTripSuitcaseById,
} = require("../controllers/tripSuitcaseController");

// old single-suitcase compatibility
router.get("/:tripId/suitcase", protect, getTripSuitcase);
router.post("/:tripId/suitcase", protect, createTripSuitcase);
router.put("/:tripId/suitcase", protect, updateTripSuitcase);

// new multi-suitcase routes
router.get("/:tripId/suitcases", protect, getTripSuitcases);
router.post("/:tripId/suitcases", protect, createTripSuitcaseByList);
router.put("/:tripId/suitcases/:suitcaseId", protect, updateTripSuitcaseById);
router.delete("/:tripId/suitcases/:suitcaseId", protect, deleteTripSuitcaseById);

module.exports = router;