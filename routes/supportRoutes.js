const express = require("express");
const {
  getAllSupports,
  getSupportById,
  addSupport,
  updateSupport,
  deleteSupport,
} = require("../controllers/supportController");

const router = express.Router();

// Routes
router.get("/get_all_supports/", getAllSupports); // Get all support entries
router.get("/get_support_by_id/:id", getSupportById); // Get a single support entry by ID
router.post("/add_support/", addSupport); // Add a new support entry
router.put("/update_support/:id", updateSupport); // Update an existing support entry
router.delete("/delete_support/:id", deleteSupport); // Delete a support entry

module.exports = router;
