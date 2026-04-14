const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getTripSimulationScene,
} = require("../controllers/tripSimulationController");

router.get("/trips/:id/simulation", authenticateToken, getTripSimulationScene);

module.exports = router;