const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getItemSizeProfiles,
  getItemFoldProfiles,
  updateTripItemProfile,
} = require("../controllers/itemProfileController");

router.get("/items/:id/size-profiles", protect, getItemSizeProfiles);
router.get("/items/:id/fold-profiles", protect, getItemFoldProfiles);
router.put("/trips/:tripId/items/:tripItemId/profile", protect, updateTripItemProfile);

module.exports = router;