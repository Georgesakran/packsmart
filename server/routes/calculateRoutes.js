const express = require ("express");
const router = express.Router();
const { calculatePacking } = require("../controllers/calculateController");

router.get("/", calculatePacking);

module.exports = router;