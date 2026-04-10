const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getCustomItems,
  getCustomItemById,
  createCustomItem,
  updateCustomItem,
  deleteCustomItem,
} = require("../controllers/customItemController");

router.get("/", protect, getCustomItems);
router.get("/:id", protect, getCustomItemById);
router.post("/", protect, createCustomItem);
router.put("/:id", protect, updateCustomItem);
router.delete("/:id", protect, deleteCustomItem);

module.exports = router;