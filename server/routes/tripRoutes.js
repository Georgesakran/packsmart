const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  archiveTrip,
  unarchiveTrip,
} = require("../controllers/tripController");

router.post("/", protect, createTrip);
router.get("/", protect, getTrips);
router.get("/:id", protect, getTripById);
router.put("/:id", protect, updateTrip);
router.delete("/:id", protect, deleteTrip);
router.post("/:id/duplicate", protect, duplicateTrip);
router.put("/:id/archive", protect, archiveTrip);
router.put("/:id/unarchive", protect, unarchiveTrip);

module.exports = router;