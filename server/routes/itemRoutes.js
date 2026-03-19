const express = require ("express");
const router = express.Router();
const { getItems } = require("../controllers/itemController");

router.get("/", getItems);

module.exports = router;