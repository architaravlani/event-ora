const express = require("express");
const router = express.Router();

const {
  getEvents,
  createEvent,
  toggleFeaturedEvent,
  updateEvent,
  deleteEvent,
  getDeletedEvents,
  restoreEvent,
  permanentlyDeleteEvent,
} = require("../controllers/eventController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public: get all active events
router.get("/", getEvents);

// Admin: view deleted events
router.get(
  "/deleted",
  authMiddleware,
  adminMiddleware,
  getDeletedEvents
);

// Admin: restore a deleted event
router.patch(
  "/:id/restore",
  authMiddleware,
  adminMiddleware,
  restoreEvent
);

// Admin: permanently delete an event
router.delete(
  "/:id/permanent",
  authMiddleware,
  adminMiddleware,
  permanentlyDeleteEvent
);

// Admin: create an event
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createEvent
);

// Admin: update an event
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateEvent
);

// Admin: move an event to the recycle bin
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteEvent
);

// Admin: feature or unfeature an event
router.patch(
  "/:id/feature",
  authMiddleware,
  adminMiddleware,
  toggleFeaturedEvent
);

module.exports = router;