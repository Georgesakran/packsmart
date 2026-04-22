const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTripItem,
  getTripItems,
  updateTripItem,
  deleteTripItem,
} = require("../controllers/tripItemController");

router.post("/:tripId/items", protect, createTripItem);
router.get("/:tripId/items", protect, getTripItems);
router.put("/:tripId/items/:tripItemId", protect, updateTripItem);
router.delete("/:tripId/items/:tripItemId", protect, deleteTripItem);
module.exports = router;