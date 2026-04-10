const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  recommendBagsForTrip,
  saveSelectedTripBags,
  getSelectedTripBags,
} = require("../controllers/tripBagRecommendationController");

router.get("/:id/recommend-bags", protect, recommendBagsForTrip);
router.get("/:id/selected-bags", protect, getSelectedTripBags);
router.post("/:id/selected-bags", protect, saveSelectedTripBags);

module.exports = router;