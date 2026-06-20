const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    activeRole: { type: String, enum: ["donor", "receiver", "ngo"], default: "donor" },
    isAdmin: { type: Boolean, default: false },
    // Admin kill-switch: when true, the user is blocked from sending SOS blasts
    // (abuse control). Enforced in sendEmergencyBlast via services/sosGuard.js.
    blastBlocked: { type: Boolean, default: false },

    // NGO Specific Fields
    organizationName: { type: String },
    isVerified: { type: Boolean, default: false }, // Crucial: NGOs must be approved before login

    // Trust & Safety
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpiry: { type: Date },
    // Phone OTP verification (proves the donor controls their number).
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerificationCode: { type: String },
    phoneVerificationExpiry: { type: Date },
    kycStatus: {
      documentVerified: { type: Boolean, default: false },
      documentType: { type: String, enum: ["aadhaar", "passport", "driving_license", "none"], default: "none" },
      kycDocumentUrl: { type: String },
      kycSubmittedAt: { type: Date },
    },

    // Web Push Subscription
    pushSubscription: { type: Object, default: null },
    fcmToken: { type: String },

    // Gamification & Trust
    points: { type: Number, default: 0 },
    donationsCount: { type: Number, default: 0 },
    requestsCount: { type: Number, default: 0 },
    rank: { type: String, default: "Novice" },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },

    phone: {
      type: String,
      validate: {
        validator: (v) => !v || v === "Not Provided" || /^\+91[6-9]\d{9}$/.test(v),
        message: "Phone must be stored in +91XXXXXXXXXX format",
      },
    },
    bloodGroup: { type: String },
    addressText: { type: String },
    isAvailable: { type: Boolean, default: true },

    // Whole-blood donors are ineligible for ~90 days after donating. Drives the
    // eligibility filter in the routing engine. Unset = never donated = eligible.
    lastDonationDate: { type: Date },
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },

    // Geospatial Tracking
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    // Medical Dossier
    medicalDossier: {
      allergies: { type: [String], default: [] },
      chronicConditions: { type: [String], default: [] },
    },

    // Emergency Contacts
    emergencyContacts: [{
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
      bloodGroup: { type: String },
    }],

    // Thank-you messages received from people user helped
    thanksReceived: [{
      donationId: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },
      message: { type: String },
      from: { type: String },
      createdAt: { type: Date, default: Date.now },
    }],

    noShowCount: { type: Number, default: 0 },

    lastActiveAt: { type: Date, default: Date.now },

    notificationPrefs: {
      emergencyNearby: { type: Boolean, default: true },
      campReminders:   { type: Boolean, default: true },
      weeklyDigest:    { type: Boolean, default: true },
      requestApproved: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Geographic Radar Index
userSchema.index({ location: "2dsphere" });

// Leaderboard Sort Index
userSchema.index({ points: -1 });

// 👉 THE FIX: Admin Growth Graph Index (OOM Prevention)
userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Eligible to donate whole blood if they have never donated, or the cooldown
// (default 90 days) has elapsed since their last donation.
userSchema.methods.isBloodEligible = function (cooldownDays = 90) {
  if (!this.lastDonationDate) return true;
  const cutoff = Date.now() - cooldownDays * 24 * 60 * 60 * 1000;
  return this.lastDonationDate.getTime() <= cutoff;
};

module.exports = mongoose.model("User", userSchema);