
const Event = require("../models/Event");

// GET all active events: upcoming first, expired last.
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } },
      ],
    })
      .populate("createdBy", "name email")
      .lean();

    const now = Date.now();

    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const expiredA = dateA < now;
      const expiredB = dateB < now;

      if (expiredA !== expiredB) return expiredA ? 1 : -1;
      return expiredA ? dateB - dateA : dateA - dateB;
    });

    return res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Failed to fetch events" });
  }
};

// CREATE event
const createEvent = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Please log in" });
    }

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

    if (
      !title?.trim() ||
      !location?.address?.trim() ||
      location.latitude == null ||
      location.longitude == null ||
      !Number.isFinite(Number(location.latitude)) ||
      !Number.isFinite(Number(location.longitude)) ||
      !date ||
      !Number.isFinite(new Date(date).getTime())
    ) {
      return res.status(400).json({
        message: "Valid title, address, coordinates, and date are required",
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
        message: "Ticket prices must be valid non-negative amounts",
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
      isFeatured: Boolean(isFeatured ?? featured),
      deletedAt: null,
      purgeAt: null,
    });

    return res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({
      message: "Failed to create event",
      error: error.message,
    });
  }
};

// FEATURE / UNFEATURE event
const toggleFeaturedEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || event.deletedAt) {
      return res.status(404).json({ message: "Active event not found" });
    }

    event.isFeatured = !event.isFeatured;
    await event.save();

    return res.status(200).json({
      success: true,
      message: event.isFeatured
        ? "Event featured successfully"
        : "Event removed from featured events",
      event,
    });
  } catch (error) {
    console.error("Feature event error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res.status(500).json({
      message: "Failed to update featured event",
    });
  }
};

// UPDATE event
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

    if (!event || event.deletedAt) {
      return res.status(404).json({ message: "Active event not found" });
    }

    const nextTitle = title ?? event.title;
    const nextLocation = location ?? event.location;
    const nextDate = date ?? event.date;

    if (
      typeof nextTitle !== "string" ||
      !nextTitle.trim() ||
      !nextLocation?.address?.trim() ||
      nextLocation.latitude == null ||
      nextLocation.longitude == null ||
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
        royal: Number(ticketPrices.royal ?? event.ticketPrices?.royal ?? 2000),
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

    return res.status(500).json({ message: "Failed to update event" });
  }
};

// SOFT DELETE: move event to Recycle Bin for 24 hours
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
    const purgeAt = new Date(deletedAt.getTime() + 24 * 60 * 60 * 1000);

    event.deletedAt = deletedAt;
    event.purgeAt = purgeAt;

    await event.save();

    return res.status(200).json({
      message: "Event moved to Recycle Bin for 24 hours",
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
      message: "Failed to move event to Recycle Bin",
      error: error.message,
    });
  }
};

// GET Recycle Bin
const getDeletedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      deletedAt: { $type: "date" },
    })
      .populate("createdBy", "name email")
      .sort({ deletedAt: -1 })
      .lean();

    return res.status(200).json(events);
  } catch (error) {
    console.error("Get deleted events error:", error);
    return res.status(500).json({
      message: "Failed to load deleted events",
      error: error.message,
    });
  }
};

// RESTORE within 24 hours
const restoreEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.deletedAt) {
      return res.status(400).json({
        message: "This event is not in the Recycle Bin",
      });
    }

    if (!event.purgeAt || new Date(event.purgeAt) <= new Date()) {
      return res.status(410).json({
        message: "The 24-hour recovery period has expired",
      });
    }

    event.deletedAt = null;
    event.purgeAt = null;

    await event.save();

    return res.status(200).json({
      message: "Event restored successfully",
      event,
    });
  } catch (error) {
    console.error("Restore event error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res.status(500).json({ message: "Failed to restore event" });
  }
};

// PERMANENT DELETE
const permanentlyDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.deletedAt) {
      return res.status(400).json({
        message: "Only events in the Recycle Bin can be permanently deleted",
      });
    }

    await event.deleteOne();

    return res.status(200).json({
      message: "Event permanently deleted",
    });
  } catch (error) {
    console.error("Permanent delete error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    return res.status(500).json({
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
