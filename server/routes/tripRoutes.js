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
  bulkDeleteTrips,
  bulkArchiveTrips,
  bulkUnarchiveTrips,
  getTripActivityHistory,
} = require("../controllers/tripController");

router.post("/", protect, createTrip);
router.get("/", protect, getTrips);
router.get("/:id", protect, getTripById);
router.put("/:id", protect, updateTrip);
router.delete("/:id", protect, deleteTrip);
router.post("/:id/duplicate", protect, duplicateTrip);
router.put("/:id/archive", protect, archiveTrip);
router.put("/:id/unarchive", protect, unarchiveTrip);
router.post("/bulk-delete", protect, bulkDeleteTrips);
router.post("/bulk-archive", protect, bulkArchiveTrips);
router.post("/bulk-unarchive", protect, bulkUnarchiveTrips);
router.get("/:id/activity-history", protect, getTripActivityHistory);

module.exports = router;