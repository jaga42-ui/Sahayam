const mongoose = require("mongoose");

const bloodCampSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    venue: { type: String, required: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    bloodGroupsNeeded: [{ type: String }],
    targetUnits: { type: Number },
    contactPhone: { type: String },
    contactName: { type: String },
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      addressText: { type: String },
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true },
);

bloodCampSchema.index({ location: "2dsphere" });
bloodCampSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model("BloodCamp", bloodCampSchema);
