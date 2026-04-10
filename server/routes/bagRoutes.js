
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getBagCatalog } = require("../controllers/bagController");

router.get("/catalog", protect, getBagCatalog);

module.exports = router;