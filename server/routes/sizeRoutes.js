const express = require ("express");
const router = express.Router();
const { getSizeMultipliers } = require("../controllers/sizeController");

router.get("/", getSizeMultipliers);

module.exports = router;