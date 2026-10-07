const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

console.log("Mongo URI check:", {
  exists: !!process.env.MONGODB_URI,
  startsCorrectly:
    process.env.MONGODB_URI?.startsWith("mongodb://") ||
    process.env.MONGODB_URI?.startsWith("mongodb+srv://"),
  length: process.env.MONGODB_URI?.length,
});

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const bookingRoutes = require("./routes/bookings");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/eventora"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) =>
    console.error("MongoDB Connection Error:", err)
  );

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});