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
router.get("/trips/:tripId/suitcase", protect, getTripSuitcase);
router.post("/trips/:tripId/suitcase", protect, createTripSuitcase);
router.put("/trips/:tripId/suitcase", protect, updateTripSuitcase);

// new multi-suitcase routes
router.get("/trips/:tripId/suitcases", protect, getTripSuitcases);
router.post("/trips/:tripId/suitcases", protect, createTripSuitcaseByList);
router.put("/trips/:tripId/suitcases/:suitcaseId", protect, updateTripSuitcaseById);
router.delete("/trips/:tripId/suitcases/:suitcaseId", protect, deleteTripSuitcaseById);

module.exports = router;