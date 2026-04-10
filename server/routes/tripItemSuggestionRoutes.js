const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getSuggestedItemsForTrip,
  applySuggestedItemsToTrip,
} = require("../controllers/tripItemSuggestionController");

router.get("/:id/suggested-items", protect, getSuggestedItemsForTrip);
router.post("/:id/apply-suggested-items", protect, applySuggestedItemsToTrip);

module.exports = router;