const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateSuggestions } = require("../controllers/tripSuggestionController");

router.post("/:tripId/generate-suggestions", protect, generateSuggestions);

module.exports = router;