const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {getTripSimulationScene,} = require("../controllers/tripSimulationController");

router.get("/trips/:id/simulation", protect, getTripSimulationScene);

module.exports = router;