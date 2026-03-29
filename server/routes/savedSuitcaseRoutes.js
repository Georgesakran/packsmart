const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getSavedSuitcases,
  createSavedSuitcase,
  updateSavedSuitcase,
  deleteSavedSuitcase,
} = require("../controllers/savedSuitcaseController");

router.get("/", protect, getSavedSuitcases);
router.post("/", protect, createSavedSuitcase);
router.put("/:id", protect, updateSavedSuitcase);
router.delete("/:id", protect, deleteSavedSuitcase);

module.exports = router;