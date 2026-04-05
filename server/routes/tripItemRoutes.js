const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTripItem,
  getTripItems,
  updateTripItem,
  deleteTripItem,
  clearTripItems,
  assignTripItemToBag,
  getTripChecklistSummary,
  updateTripItemPackingStatus
} = require("../controllers/tripItemController");

router.post("/:tripId/items", protect, createTripItem);
router.get("/:tripId/items", protect, getTripItems);
router.put("/:tripId/items/:tripItemId", protect, updateTripItem);
router.delete("/:tripId/items/:tripItemId", protect, deleteTripItem);
router.delete("/:tripId/items", protect, clearTripItems);
router.put("/:tripId/items/:itemId/assign-bag", protect, assignTripItemToBag);
router.put("/:tripId/items/:itemId/packing-status",protect,updateTripItemPackingStatus);
router.get("/:tripId/checklist-summary",protect,getTripChecklistSummary);

module.exports = router;