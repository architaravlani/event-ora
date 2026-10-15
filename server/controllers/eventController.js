
const Event = require("../models/Event");

// GET all events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ deletedAt: null })
  .populate("createdBy", "name email")
  .lean();

    const now = new Date();

    events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      const expiredA = dateA < now;
      const expiredB = dateB < now;

      // Upcoming events first
      if (expiredA !== expiredB) {
        return expiredA ? 1 : -1;
      }

      // Upcoming: nearest first
      // Expired: most recently expired first
      return expiredA ? dateB - dateA : dateA - dateB;
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);

    res.status(500).json({
      message: "Failed to fetch events",
    });
  }
};

// CREATE event
const createEvent = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Please log in",
      });
    }

    const {
      title,
      description,
      category,
      location,
      date,
      image,
      featured,
      ticketPrices,
    } = req.body;

    if (!title?.trim() || !location?.address?.trim() || !date) {
      return res.status(400).json({
        message: "Title, address, and date are required",
      });
    }

    if (!location.latitude || !location.longitude) {
      // Latitude or longitude can legitimately be zero.
      if (
        location.latitude == null ||
        location.longitude == null ||
        !Number.isFinite(Number(location.latitude)) ||
        !Number.isFinite(Number(location.longitude))
      ) {
        return res.status(400).json({
          message: "Valid map coordinates are required",
        });
      }
    }

    if (Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        message: "Please provide a valid event date",
      });
    }

    const prices = {
      gold: Number(ticketPrices?.gold ?? 500),
      premium: Number(ticketPrices?.premium ?? 1000),
      royal: Number(ticketPrices?.royal ?? 2000),
    };

    if (
      Object.values(prices).some(
        (price) => !Number.isFinite(price) || price < 0
      )
    ) {
      return res.status(400).json({
        message: "Ticket prices must be valid, non-negative amounts",
      });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description || "",
      category: category || "Other",
      location: {
        address: location.address.trim(),
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      },
      date: new Date(date),
      image: image || "",
      ticketPrices: prices,
      createdBy: req.user.userId,
      isFeatured: Boolean(featured),
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);

    res.status(500).json({
      message: "Failed to create event",
      error: error.message,
    });
  }
};

// FEATURE / UNFEATURE event
const toggleFeaturedEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    event.isFeatured = !event.isFeatured;
    await event.save();

    res.status(200).json({
      success: true,
      message: event.isFeatured
        ? "Event featured successfully"
        : "Event removed from featured events",
      event,
    });
  } catch (error) {
    console.error("Feature event error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    res.status(500).json({
      message: "Failed to update featured event",
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      date,
      image,
      featured,
      isFeatured,
      ticketPrices,
    } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const nextTitle = title ?? event.title;
    const nextLocation = location ?? event.location;
    const nextDate = date ?? event.date;

    if (
      typeof nextTitle !== "string" ||
      !nextTitle.trim() ||
      !nextLocation?.address?.trim() ||
      !Number.isFinite(Number(nextLocation.latitude)) ||
      !Number.isFinite(Number(nextLocation.longitude)) ||
      !Number.isFinite(new Date(nextDate).getTime())
    ) {
      return res.status(400).json({
        message: "Valid title, address, coordinates, and date are required",
      });
    }

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description;
    if (category !== undefined) event.category = category;

    if (location !== undefined) {
      event.location = {
        address: location.address.trim(),
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      };
    }

    if (date !== undefined) event.date = new Date(date);
    if (image !== undefined) event.image = image;

    const featuredValue = isFeatured ?? featured;
    if (featuredValue !== undefined) {
      event.isFeatured =
        featuredValue === true || featuredValue === "true";
    }

    if (ticketPrices !== undefined) {
      const prices = {
        gold: Number(ticketPrices.gold ?? event.ticketPrices?.gold ?? 500),
        premium: Number(
          ticketPrices.premium ?? event.ticketPrices?.premium ?? 1000
        ),
        royal: Number(
          ticketPrices.royal ?? event.ticketPrices?.royal ?? 2000
        ),
      };

      if (
        Object.values(prices).some(
          (price) => !Number.isFinite(price) || price < 0
        )
      ) {
        return res.status(400).json({
          message: "Ticket prices must be valid non-negative amounts",
        });
      }

      event.ticketPrices = prices;
    }

    await event.save();

    return res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res.status(500).json({
      message: "Failed to update event",
    });
  }
};


const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.deletedAt) {
      return res.status(400).json({
        message: "This event is already in the recycle bin",
      });
    }

    const deletedAt = new Date();
    const purgeAt = new Date(
      deletedAt.getTime() + 24 * 60 * 60 * 1000
    );

    event.deletedAt = deletedAt;
    event.purgeAt = purgeAt;

    await event.save();

    return res.status(200).json({
      message: "Event moved to recycle bin. You can restore it within 24 hours.",
      eventId: event._id,
      deletedAt,
      purgeAt,
    });
  } catch (error) {
    console.error("Soft delete event error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res.status(500).json({
      message: "Failed to move event to recycle bin",
    });
  }
};

const getDeletedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      deletedAt: { $ne: null },
    })
      .populate("createdBy", "name email")
      .sort({ deletedAt: -1 })
      .lean();

    res.status(200).json(events);
  } catch (error) {
    console.error("Get deleted events error:", error);
    res.status(500).json({
      message: "Failed to fetch deleted events",
    });
  }
};

const restoreEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found. It may have been permanently deleted.",
      });
    }

    if (!event.deletedAt) {
      return res.status(400).json({
        message: "This event is not in the recycle bin",
      });
    }

    if (!event.purgeAt || event.purgeAt <= new Date()) {
      return res.status(410).json({
        message: "The 24-hour recovery period has expired",
      });
    }

    event.deletedAt = null;
    event.purgeAt = null;

    await event.save();

    res.status(200).json({
      message: "Event restored successfully",
      event,
    });
  } catch (error) {
    console.error("Restore event error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    res.status(500).json({
      message: "Failed to restore event",
    });
  }
};

const permanentlyDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.deletedAt) {
      return res.status(400).json({
        message: "Only deleted events can be permanently removed here",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      message: "Event permanently deleted",
    });
  } catch (error) {
    console.error("Permanent delete error:", error);

    res.status(500).json({
      message: "Failed to permanently delete event",
    });
  }
};


module.exports = {
  getEvents,
  createEvent,
  toggleFeaturedEvent,
  updateEvent,
  getDeletedEvents,
restoreEvent,
permanentlyDeleteEvent,
  deleteEvent,
};
