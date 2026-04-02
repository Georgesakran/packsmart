const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTripItem,
  getTripItems,
  updateTripItem,
  deleteTripItem,
  clearTripItems,
} = require("../controllers/tripItemController");

router.post("/:tripId/items", protect, createTripItem);
router.get("/:tripId/items", protect, getTripItems);
router.put("/:tripId/items/:tripItemId", protect, updateTripItem);
router.delete("/:tripId/items/:tripItemId", protect, deleteTripItem);
router.delete("/trips/:tripId/items", protect, clearTripItems);

module.exports = router;