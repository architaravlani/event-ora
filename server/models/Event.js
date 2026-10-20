
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "Other",
    },

    location: {
      address: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    date: {
      type: Date,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    ticketPrices: {
      gold: {
        type: Number,
        default: 500,
        min: 0,
      },
      premium: {
        type: Number,
        default: 1000,
        min: 0,
      },
      royal: {
        type: Number,
        default: 2000,
        min: 0,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Recycle Bin fields
    deletedAt: {
      type: Date,
      default: null,
    },

    purgeAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically remove an event when its 24-hour recovery period expires.
eventSchema.index(
  { purgeAt: 1 },
  { expireAfterSeconds: 0 }
);

// Prevent OverwriteModelError during repeated imports.
const Event =
  mongoose.models.Event || mongoose.model("Event", eventSchema);

module.exports =
  mongoose.models.Event ||
  mongoose.model("Event", eventSchema);
