
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

// GET all active events
router.get("/", getEvents);

// GET Recycle Bin events — admin only
router.get(
  "/deleted",
  authMiddleware,
  adminMiddleware,
  getDeletedEvents
);

// RESTORE an event from Recycle Bin — admin only
router.patch(
  "/:id/restore",
  authMiddleware,
  adminMiddleware,
  restoreEvent
);

// PERMANENTLY delete an event from Recycle Bin — admin only
router.delete(
  "/:id/permanent",
  authMiddleware,
  adminMiddleware,
  permanentlyDeleteEvent
);

// CREATE an event — admin only
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createEvent
);

// UPDATE an event — admin only
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateEvent
);

// SOFT DELETE an event — admin only
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteEvent
);

// FEATURE / UNFEATURE an event — admin only
router.patch(
  "/:id/feature",
  authMiddleware,
  adminMiddleware,
  toggleFeaturedEvent
);

module.exports = router;
