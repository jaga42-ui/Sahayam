const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getNearbyCamps, createCamp, registerForCamp } = require("../controllers/campController");

router.get("/", protect, getNearbyCamps);
router.post("/", protect, createCamp);
router.post("/:id/register", protect, registerForCamp);

module.exports = router;
