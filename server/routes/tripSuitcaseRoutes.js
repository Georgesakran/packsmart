const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTripSuitcases,
} = require("../controllers/tripSuitcaseController");

router.get("/:tripId/suitcases", protect, getTripSuitcases);

module.exports = router;