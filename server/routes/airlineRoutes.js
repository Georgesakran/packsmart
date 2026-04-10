const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getAirlines, getAirlineBaggageRules } = require("../controllers/airlineController");

router.get("/", protect, getAirlines);
router.get("/:id/baggage-rules", protect, getAirlineBaggageRules);


module.exports = router;