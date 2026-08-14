const express = require("express");

const {
  createBooking,
  getBookingsByEmail,
} = require("../controllers/bookingController");

const router = express.Router();

// Create booking
router.post("/", createBooking);

// Get bookings by email
router.get("/", getBookingsByEmail);

module.exports = router;