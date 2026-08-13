const express = require("express");

const { createBooking } = require("../controllers/bookingController");

const router = express.Router();

// Create a new booking
router.post("/", createBooking);

module.exports = router;