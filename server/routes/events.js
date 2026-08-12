const express = require("express");

const {
  getEvents,
  createEvent,
} = require("../controllers/eventController");

const router = express.Router();

// Get all events
router.get("/", getEvents);

// Create a new event
router.post("/", createEvent);

module.exports = router;