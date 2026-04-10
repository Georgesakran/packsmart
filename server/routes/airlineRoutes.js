const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getAirlines } = require("../controllers/airlineController");

router.get("/", protect, getAirlines);

module.exports = router;