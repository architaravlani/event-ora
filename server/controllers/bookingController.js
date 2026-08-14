const Booking = require("../models/Booking");

// Create a booking
const createBooking = async (req, res) => {
  try {
    const { event, name, email } = req.body;

    if (!event || !name || !email) {
      return res.status(400).json({
        message: "Event, name, and email are required",
      });
    }

    const booking = await Booking.create({
      event,
      name,
      email,
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking error:", error);

    res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
};


// Get bookings by email
const getBookingsByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const bookings = await Booking.find({
      email: email.toLowerCase(),
    }).populate("event");

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);

    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};


module.exports = {
  createBooking,
  getBookingsByEmail,
};