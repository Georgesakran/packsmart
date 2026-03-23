const express = require ("express");
const router = express.Router();
const { calculatePacking } = require("../controllers/calculateController");

router.post("/", calculatePacking);

module.exports = router;