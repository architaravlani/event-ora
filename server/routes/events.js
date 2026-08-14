const express = require("express");

const {
  getEvents,
  createEvent,
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all events
router.get("/", getEvents);

// Create a new event
router.post("/", authMiddleware, createEvent);

module.exports = router;