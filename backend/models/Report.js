const mongoose = require("mongoose");

/**
 * A user-reported-a-user record (harassment, spam, scam, etc.). Logged for
 * admin review; the reporter is auto-blocked from the reportee at report time.
 */
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: {
      type: String,
      enum: ["spam", "harassment", "scam", "fake", "other"],
      default: "other",
    },
    note: { type: String, maxlength: 500 },
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", default: null },
    status: { type: String, enum: ["open", "reviewed", "actioned"], default: "open" },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
