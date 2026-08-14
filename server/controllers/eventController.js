const Event = require("../models/Event");

// Get all events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
  .populate("createdBy", "name email")
  .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  try {
   const event = await Event.create({
  ...req.body,
  createdBy: req.user.userId,
});
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create event",
      error: error.message,
    });
  }
};

module.exports = {
  getEvents,
  createEvent,
};