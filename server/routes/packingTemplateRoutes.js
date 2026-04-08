const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPackingTemplates,
  getPackingTemplateById,
  createPackingTemplate,
  updatePackingTemplate,
  deletePackingTemplate,
  applyTemplateToTrip,
  saveTripAsTemplate,
} = require("../controllers/packingTemplateController");

router.get("/", protect, getPackingTemplates);
router.get("/:id", protect, getPackingTemplateById);
router.post("/", protect, createPackingTemplate);
router.put("/:id", protect, updatePackingTemplate);
router.delete("/:id", protect, deletePackingTemplate);
router.post("/apply/:templateId/trips/:tripId", protect, applyTemplateToTrip);
router.post("/from-trip/:tripId", protect, saveTripAsTemplate);
module.exports = router;