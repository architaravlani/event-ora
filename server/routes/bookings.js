const express = require("express");

const {
  createBooking,
  getBookingsByEmail,
  getAllBookings,
  confirmDemoPayment,
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", createBooking);
router.get("/", getBookingsByEmail);

router.post("/:bookingId/confirm-payment", confirmDemoPayment);

router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  getAllBookings
);

module.exports = router;