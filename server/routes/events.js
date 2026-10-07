const express = require("express");

const {
  getEvents,
  createEvent,
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Anyone can view events
router.get("/", getEvents);

// Only logged-in admins can create events
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createEvent
);

module.exports = router;