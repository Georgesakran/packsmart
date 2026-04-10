const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generatePackingSteps,
  getPackingSteps,
  completePackingStep,
} = require("../controllers/tripPackingStepsController");

router.post("/:id/generate-packing-steps", protect, generatePackingSteps);
router.get("/:id/packing-steps", protect, getPackingSteps);
router.put("/:id/packing-steps/:stepId/complete", protect, completePackingStep);

module.exports = router;