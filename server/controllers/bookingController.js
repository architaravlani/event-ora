
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");

const DEFAULT_PRICES = {
  gold: 500,
  premium: 1000,
  royal: 2000,
};

// Create a booking
const createBooking = async (req, res) => {
  try {
    const {
      event,
      name,
      email,
      phone = "",
      ticketType = "gold",
      quantity = 1,
    } = req.body;

    if (!event || !name || !email) {
      return res.status(400).json({
        message: "Event, name and email are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(event)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const eventDetails = await Event.findById(event);

    if (!eventDetails) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    if (eventDetails.date && new Date(eventDetails.date) < new Date()) {
      return res.status(400).json({
        message: "This event has already expired",
      });
    }

    const normalizedTicketType = String(ticketType).toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(
      DEFAULT_PRICES,
      normalizedTicketType
    )) {
      return res.status(400).json({
        message: "Invalid ticket type",
      });
    }

    const ticketQuantity = Number(quantity);

    if (
      !Number.isInteger(ticketQuantity) ||
      ticketQuantity < 1 ||
      ticketQuantity > 10
    ) {
      return res.status(400).json({
        message: "Quantity must be between 1 and 10",
      });
    }

    const configuredPrice =
      eventDetails.ticketPrices?.[normalizedTicketType];

    const pricePerTicket =
      Number.isFinite(Number(configuredPrice)) &&
      configuredPrice !== undefined &&
      configuredPrice !== null
        ? Number(configuredPrice)
        : DEFAULT_PRICES[normalizedTicketType];

    const totalPrice = pricePerTicket * ticketQuantity;

    const booking = await Booking.create({
      event: eventDetails._id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone).trim(),
      ticketType: normalizedTicketType,
      quantity: ticketQuantity,
      pricePerTicket,
      totalPrice,
      bookingStatus: "confirmed",
      paymentStatus: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("event", "title date location");

    return res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({
      message: "Could not create booking",
    });
  }
};

// Get bookings for a user's email
const getBookingsByEmail = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const bookings = await Booking.find({ email })
      .populate("event", "title date location image")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({
      message: "Could not fetch bookings",
    });
  }
};

// Admin: get all bookings
const getAllBookings = async (req, res) => {
  try {
    const records = await Booking.find()
      .populate("event", "title date location")
      .sort({ createdAt: -1 })
      .lean();

    const bookings = records.map((booking) => ({
      _id: booking._id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone || "",
      event:
        booking.event?.title ||
        "Event unavailable",
      eventDate: booking.event?.date || null,
      ticketType: booking.ticketType,
      tickets: booking.quantity,
      amount:
        booking.totalPrice ??
        booking.quantity * booking.pricePerTicket,
      paymentStatus: booking.paymentStatus || "pending",
      bookingStatus: booking.bookingStatus || "confirmed",
      bookedAt: booking.createdAt,
    }));

    return res.json({
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Admin bookings error:", error);
    return res.status(500).json({
      message: "Could not fetch bookings",
    });
  }
};

// Confirm demo payment for a booking
const confirmDemoPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      email: email.trim().toLowerCase(),
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    booking.paymentStatus = "paid";
    await booking.save();

    return res.json({
      message: "Demo payment successful",
      booking,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({
      message: "Could not confirm payment",
    });
  }
};

module.exports = {
  createBooking,
  getBookingsByEmail,
  getAllBookings,
  confirmDemoPayment,
};
