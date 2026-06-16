const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    // The person who posted the item
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // A list of everyone who clicked "I want this"
    requestedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // The ONE person who actually gets approved to receive it
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 👉 THE TRUST & SAFETY ADDITION: Tracks users who reported this post
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 👉 FEATURE 3: Institutional Nodes
    verifiedByInstitution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 👉 FEATURE 1: AI Triage Severity
    severityLevel: {
      type: String,
      enum: ["Code Red", "Code Yellow", "Code Green", "Unverified"],
      default: "Unverified",
    },

    listingType: {
      type: String,
      enum: ["donation", "request"],
      default: "donation",
      required: true,
    },
    category: {
      type: String,
      enum: ["food", "clothes", "book", "blood", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: String },

    condition: { type: String },
    foodType: { type: String },
    expiryDate: { type: Date },
    pickupTime: { type: String },
    bookAuthor: { type: String },

    pickupPIN: { type: String, required: true },
    image: { type: String },
    isEmergency: { type: Boolean, default: false },
    bloodGroup: { type: String },

    // Emergency Medical Context
    patientDetails: {
      name: { type: String },
      age: { type: Number },
      contactPhone: { type: String },
    },
    hospitalRoomNumber: { type: String },
    criticalDeadline: { type: Date },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      addressText: { type: String },
    },

    status: {
      type: String,
      enum: [
        "active",
        "available",
        "pending",
        "fulfilled",
        "hidden",
        "expired",
      ],
      default: "active",
    },

    thankYouMessage: {
      text: { type: String },
      sentAt: { type: Date },
      fromName: { type: String },
    },
  },
  { timestamps: true },
);

// 👉 GEOSPATIAL INDEX: For Radar map and nearby searches
donationSchema.index({ location: "2dsphere" });

// 👉 THE FIX: PERFORMANCE INDEXES
// 1. Speeds up the main feed (fetching active posts sorted by newest)
donationSchema.index({ status: 1, createdAt: -1 });

// 2. Speeds up category filtering (e.g., when a user clicks the "Food" button)
donationSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model("Donation", donationSchema);
