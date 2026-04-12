const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTravelPresets,
  getTravelPresetById,
  saveTripAsPreset,
  applyPresetToTrip,
  deleteTravelPreset,
  createTripFromPreset,
} = require("../controllers/travelPresetController");

router.get("/travel-presets", protect, getTravelPresets);
router.get("/travel-presets/:id", protect, getTravelPresetById);
router.delete("/travel-presets/:id", protect, deleteTravelPreset);

router.post("/trips/:id/save-as-preset", protect, saveTripAsPreset);
router.post("/trips/:id/apply-preset/:presetId", protect, applyPresetToTrip);
router.post("/travel-presets/:presetId/create-trip", protect, createTripFromPreset);

module.exports = router;