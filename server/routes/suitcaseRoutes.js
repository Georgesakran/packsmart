const express = require ("express");
const router = express.Router();
const { getSuitcases } = require("../controllers/suitcaseController");

router.get("/", getSuitcases);

module.exports = router;