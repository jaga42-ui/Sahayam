const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Blast = require("../models/Blast");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const { sendPostAlertEmail } = require("../utils/sendEmail");
const { evaluateText } = require("../utils/spamDetector");
const { findEligibleDonors } = require("../services/donorMatching");
const { notifyDonors } = require("../utils/notify");
const { levelConfig, nextEscalationAt } = require("../services/escalationEngine");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin Initialized successfully");
    } else {
      console.log(
        "⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Push notifications disabled.",
      );
    }
  } catch (error) {
    console.log("⚠️ Firebase Admin setup failed:", error.message);
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, password, phone, activeRole, bloodGroup, organizationName, refCode } = req.body;
  // 👉 THE FIX: Normalize email to prevent duplicate accounts
  const email = req.body.email ? req.body.email.toLowerCase().trim() : "";

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please add all required fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const referralCode = name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    bloodGroup: bloodGroup || undefined,
    activeRole: activeRole || "donor",
    isAdmin: false,
    organizationName: activeRole === "ngo" ? organizationName : undefined,
    isVerified: activeRole === "ngo" ? false : true,
    profilePic: "",
    addressText: "",
    location: { type: "Point", coordinates: [0, 0] },
    isEmailVerified: false,
    emailVerificationToken: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit OTP
  });

  if (user) {
    if (refCode) {
      const referrer = await User.findOne({ referralCode: refCode.toUpperCase() });
      if (referrer) {
        referrer.points += 50;
        await referrer.save();
      }
    }

    // 👉 NEW: Send Welcome & Verification Email
    const { sendWelcomeEmail, sendVerificationEmail } = require('../utils/sendEmail');
    sendWelcomeEmail(user.email, user.name).catch(console.error);
    sendVerificationEmail(user.email, user.name, user.emailVerificationToken).catch(console.error);

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
      isAdmin: user.isAdmin,
      profilePic: user.profilePic,
      addressText: user.addressText,
      referralCode: user.referralCode,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // 👉 THE FIX: Normalize email before querying DB
  const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
  const password = req.body.password;
  
  const user = await User.findOne({ email });

  if (user && user.activeRole === "ngo" && !user.isVerified) {
    res.status(403);
    throw new Error("NGO Account pending verification. Please contact support.");
  }

  // 👉 THE FIX: Trust and Safety - Block unverified emails
  if (user && !user.isEmailVerified && user.activeRole !== "ngo") {
    res.status(403);
    throw new Error("Please verify your email address before logging in.");
  }

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
      isAdmin: user.isAdmin,
      profilePic: user.profilePic,
      bloodGroup: user.bloodGroup,
      addressText: user.addressText,
      referralCode: user.referralCode,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

const toggleRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.activeRole = user.activeRole === "donor" ? "receiver" : "donor";
  const updatedUser = await user.save();

  res.json({
    _id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    activeRole: updatedUser.activeRole,
    isAdmin: updatedUser.isAdmin,
    profilePic: updatedUser.profilePic,
    bloodGroup: updatedUser.bloodGroup,
    addressText: updatedUser.addressText,
    token: req.headers.authorization.split(" ")[1],
  });
});

const googleLogin = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error("Authorization code not provided");
  }

  try {
    const { tokens } = await client.getToken({
      code,
      redirect_uri: "postmessage",
    });
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // 👉 THE FIX: Ensure Google emails are also normalized
    const email = payload.email ? payload.email.toLowerCase().trim() : "";
    const { name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const securePass = `Sahayam_${Math.random().toString(36).slice(-8)}!`;
      user = await User.create({
        name: name || "New Hero",
        email,
        password: securePass,
        profilePic: picture || "",
        googleId,
        phone: "Not Provided",
        activeRole: "donor",
        points: 10,
        location: { type: "Point", coordinates: [0, 0] },
      });
    } else {
      if (!user.profilePic && picture) {
        user.profilePic = picture;
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
      isAdmin: user.isAdmin,
      profilePic: user.profilePic,
      bloodGroup: user.bloodGroup,
      addressText: user.addressText,
      points: user.points,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500);
    throw new Error("Google authentication failed. Please try again.");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
    user.phone = req.body.phone || user.phone;
    user.addressText = req.body.addressText || user.addressText;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      activeRole: updatedUser.activeRole,
      isAdmin: updatedUser.isAdmin,
      bloodGroup: updatedUser.bloodGroup,
      phone: updatedUser.phone,
      addressText: updatedUser.addressText,
      token: req.headers.authorization.split(" ")[1],
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const saveFCMToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.fcmToken = req.body.fcmToken;
  await user.save();
  res.status(200).json({ message: "Device securely registered for lock-screen alerts." });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) res.json(user);
  else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, addressText } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    user.location = { type: "Point", coordinates: [lng, lat] };
    if (addressText) user.addressText = addressText;
    await user.save();
    res.json({ message: "Live location locked in." });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const getNearbyDonors = asyncHandler(async (req, res) => {
  const { lat, lng, bloodGroup, distance = 15000 } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error("Latitude and longitude are required to scan for nearby nodes");
  }

  // When a specific group is chosen we treat this as a blood search so the
  // routing engine applies compatibility + donor eligibility; "All" just shows
  // every nearby donor. Results carry a real distance (metres) for the map.
  const isBloodSearch = bloodGroup && bloodGroup !== "All";

  const donors = await findEligibleDonors({
    lng: Number(lng),
    lat: Number(lat),
    radiusMeters: Number(distance),
    category: isBloodSearch ? "blood" : "other",
    bloodGroup: isBloodSearch ? bloodGroup : undefined,
    excludeIds: [req.user._id],
    requireAvailable: false, // the radar shows all members, available or not
    limit: 200,
  });

  // 👉 PRIVACY: the matching engine returns email + fcmToken for the
  // notification path; never expose those to the map client.
  const safeDonors = donors.map(({ email, fcmToken, ...donor }) => donor);

  res.json(safeDonors);
});

const sendEmergencyBlast = asyncHandler(async (req, res) => {
  const { lat, lng, message, bloodGroup, hospitalName } = req.body;

  if (!lat || !lng || !message) {
    res.status(400);
    throw new Error("Location and message are required for a blast");
  }

  // Replacement-donor mode: how many donors the family needs to bring (1–20).
  const unitsNeeded = Math.min(Math.max(parseInt(req.body.unitsNeeded, 10) || 1, 1), 20);

  // 👉 AI & SMART ROUTING: Spam Detection
  const spamCheck = evaluateText(message);
  if (spamCheck.isSpam) {
    res.status(400);
    throw new Error(`Broadcast blocked: ${spamCheck.reason}`);
  }

  // The SOS always starts at the tightest escalation ring and widens only if
  // nobody responds (handled by the escalation cron). Matching runs through the
  // shared engine so compatibility + eligibility are applied consistently.
  const level1 = levelConfig(1);
  const donors = await findEligibleDonors({
    lng: Number(lng),
    lat: Number(lat),
    radiusMeters: level1.radiusMeters,
    category: "blood",
    bloodGroup,
    excludeIds: [req.user._id],
    limit: 100,
  });

  const blast = await Blast.create({
    requester: req.user._id,
    message,
    category: "blood",
    bloodGroup,
    unitsNeeded,
    hospitalName,
    location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
    status: "broadcasting",
    escalationLevel: 1,
    pingLevel: 1, // legacy mirror
    radiusMeters: level1.radiusMeters,
    nextEscalationAt: nextEscalationAt(1),
    pingedDonors: donors.map((d) => d._id),
  });

  const unitsLabel = unitsNeeded > 1 ? ` — ${unitsNeeded} donors needed` : "";
  const delivery = await notifyDonors(donors, {
    title: `🚨 URGENT: ${bloodGroup || "Help"} Needed Nearby${unitsLabel}`,
    body: hospitalName ? `${message} (at ${hospitalName})` : message,
    bloodGroup,
    isEmergency: true,
    meta: {
      requesterName: req.user.name,
      requesterPhone: req.user.phone,
      lat,
      lng,
    },
  });

  console.log(
    `🔥 Blast ${blast._id}: reached ${delivery.push} devices + ${delivery.email} emails across ${donors.length} donors (need ${unitsNeeded}).`,
  );

  res.status(200).json({
    success: true,
    blastId: blast._id,
    recipients: donors.length,
    unitsNeeded,
  });
});

const respondToBlast = asyncHandler(async (req, res) => {
  const blast = await Blast.findById(req.params.id);
  if (!blast) {
    res.status(404);
    throw new Error("SOS alert no longer active");
  }

  if (["expired", "cancelled", "fulfilled"].includes(blast.status)) {
    res.status(400);
    throw new Error("This SOS is no longer accepting responders.");
  }

  const alreadyResponded = blast.responses.find(
    (r) => r.donor.toString() === req.user._id.toString(),
  );
  if (alreadyResponded) return res.json(blast);

  const { calculateRank, getPointsForAction } = require("../utils/gamification");

  blast.responses.push({ donor: req.user._id });
  if (!blast.firstResponseAt) blast.firstResponseAt = new Date();

  // Replacement-donor mode: only fully matched (and escalation stopped) once
  // enough donors have committed. Otherwise the cron keeps recruiting.
  const committed = blast.responses.length;
  const needed = blast.unitsNeeded || 1;
  const covered = committed >= needed;
  if (covered) {
    blast.status = "matched";
    blast.matchedAt = new Date();
    blast.nextEscalationAt = null;
  }
  await blast.save();

  const responder = await User.findById(req.user._id);
  responder.points += getPointsForAction('RESPOND_SOS');
  responder.rank = calculateRank(responder.points);
  await responder.save();

  const io = req.app.get("io");
  if (io) {
    io.to(blast.requester.toString()).emit("donor_coming", {
      donorName: req.user.name,
      donorPic: req.user.profilePic,
      blastId: blast._id,
      committed,
      needed,
      covered,
    });
  }

  res.json({
    message: covered
      ? "You're confirmed — the request is now fully covered!"
      : `You're confirmed! ${committed} of ${needed} donors so far.`,
    committed,
    needed,
    covered,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  // 👉 THE FIX: Normalize email
  const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "If an account with that email exists, a security clearance link has been dispatched." });
  }

  const secret = process.env.JWT_SECRET + user.password;
  const token = jwt.sign({ email: user.email, id: user._id }, secret, {
    expiresIn: "15m",
  });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;

  const { sendPasswordResetEmail } = require('../utils/sendEmail');
  
  // Fire in background
  sendPasswordResetEmail(user.email, resetLink);
  
  res.json({ message: "If an account with that email exists, a security clearance link has been dispatched." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const secret = process.env.JWT_SECRET + user.password;

  try {
    jwt.verify(token, secret);
    user.password = password;
    await user.save();
    res.json({
      message: "Password has been successfully reset. You can now log in.",
    });
  } catch (error) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired.");
  }
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isAvailable = !user.isAvailable;
  await user.save();
  
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePic: user.profilePic,
    activeRole: user.activeRole,
    isAdmin: user.isAdmin,
    points: user.points,
    rank: user.rank,
    rating: user.rating,
    donationsCount: user.donationsCount,
    addressText: user.addressText,
    isAvailable: user.isAvailable
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    res.status(400);
    throw new Error("Email and token are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isEmailVerified) {
    return res.json({ message: "Email already verified. You can log in." });
  }

  if (user.emailVerificationToken !== token) {
    res.status(400);
    throw new Error("Invalid verification code");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({ message: "Email successfully verified! You can now log in." });
});

module.exports = {
  registerUser,
  loginUser,
  toggleRole,
  updateProfile,
  googleLogin,
  saveFCMToken,
  getMe,
  updateLocation,
  getNearbyDonors,
  sendEmergencyBlast,
  respondToBlast,
  forgotPassword,
  resetPassword,
  toggleAvailability,
  verifyEmail,
};