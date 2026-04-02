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
} = require("../controllers/packingTemplateController");

router.get("/", protect, getPackingTemplates);
router.get("/:id", protect, getPackingTemplateById);
router.post("/", protect, createPackingTemplate);
router.put("/:id", protect, updatePackingTemplate);
router.delete("/:id", protect, deletePackingTemplate);
router.post("/apply/:templateId/trips/:tripId", protect, applyTemplateToTrip);

module.exports = router;