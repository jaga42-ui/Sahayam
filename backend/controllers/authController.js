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
const { recordBlastResponse } = require("../services/blastResponse");
const { canStartSOS } = require("../services/sosGuard");
const { generateOtp, otpExpiry, checkOtp } = require("../services/phoneVerification");
const sendSMS = require("../utils/sendSMS");
const { deleteUserAccount } = require("../services/accountDeletion");
const { getVerification } = require("../services/donorVerification");

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

const normalizePhone = (raw) => {
  if (!raw || raw === "Not Provided") return raw;
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.length === 10
    ? digits
    : null;
  if (!ten || !/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, password, phone, activeRole, bloodGroup, organizationName, refCode } = req.body;
  // 👉 THE FIX: Normalize email to prevent duplicate accounts
  const email = req.body.email ? req.body.email.toLowerCase().trim() : "";

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please add all required fields");
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    res.status(400);
    throw new Error("Enter a valid 10-digit Indian mobile number starting with 6–9");
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
    phone: normalizedPhone,
    bloodGroup: bloodGroup || undefined,
    activeRole: activeRole || "donor",
    isAdmin: false,
    organizationName: activeRole === "ngo" ? organizationName : undefined,
    isVerified: activeRole === "ngo" ? false : true,
    profilePic: "",
    addressText: "",
    location: { type: "Point", coordinates: [0, 0] },
    isEmailVerified: false,
    emailVerificationToken: Math.floor(100000 + Math.random() * 900000).toString(),
    emailVerificationTokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
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
        isEmailVerified: true,
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
    if (req.body.phone) {
      const normalized = normalizePhone(req.body.phone);
      if (!normalized) { res.status(400); throw new Error("Invalid phone number"); }
      user.phone = normalized;
    }
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
  // notification path; never expose those to the map client. We attach a
  // verification badge (derived from email/KYC) so requesters can see which
  // donors are trustworthy.
  const safeDonors = donors.map((d) => {
    const { email, fcmToken, ...donor } = d;
    return { ...donor, verification: getVerification(d) };
  });

  res.json(safeDonors);
});

const sendEmergencyBlast = asyncHandler(async (req, res) => {
  const { lat, lng, message, bloodGroup, hospitalName } = req.body;

  if (!lat || !lng || !message) {
    res.status(400);
    throw new Error("Location and message are required for a blast");
  }

  // 👉 ABUSE GUARD: stop a user from flooding donors — no broadcasting if their
  // account is blocked, an SOS is already in flight, or they're inside the
  // cooldown window. (See services/sosGuard.js.)
  const latestBlast = await Blast.findOne({ requester: req.user._id })
    .sort({ createdAt: -1 })
    .select("status createdAt")
    .lean();
  const gate = canStartSOS({ blastBlocked: req.user.blastBlocked, latestBlast });
  if (!gate.allowed) {
    res.status(gate.code);
    throw new Error(gate.reason);
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
  const heroId = req.user._id;

  // 👉 ATOMIC RESPONSE: record this donor in a single conditional update so
  // concurrent responders can't over-fill a replacement-donor request or
  // double-commit. See services/blastResponse.js for the guarantee.
  const claimed = await recordBlastResponse(req.params.id, heroId);

  // The update matched nothing — figure out why so the client gets the right
  // signal (idempotent re-tap, closed SOS, or a slot that filled up first).
  if (!claimed) {
    const current = await Blast.findById(req.params.id);
    if (!current) {
      res.status(404);
      throw new Error("SOS alert no longer active");
    }
    const already = current.responses.some(
      (r) => r.donor.toString() === heroId.toString(),
    );
    if (already) return res.json(current); // already on the way — no double credit
    if (["expired", "cancelled", "fulfilled"].includes(current.status)) {
      res.status(400);
      throw new Error("This SOS is no longer accepting responders.");
    }
    res.status(409);
    throw new Error("This SOS already has enough donors on the way.");
  }

  const { calculateRank, getPointsForAction } = require("../utils/gamification");

  const committed = claimed.responses.length;
  const needed = claimed.unitsNeeded || 1;
  const covered = committed >= needed;

  const responder = await User.findById(req.user._id);
  responder.points += getPointsForAction('RESPOND_SOS');
  responder.rank = calculateRank(responder.points);
  await responder.save();

  const io = req.app.get("io");
  if (io) {
    io.to(claimed.requester.toString()).emit("donor_coming", {
      donorName: req.user.name,
      donorPic: req.user.profilePic,
      blastId: claimed._id,
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

  if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
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

// @route DELETE /api/auth/me  (protected)
// Right to erasure: permanently delete the user and all their data, and scrub
// references to them from other people's content.
const deleteMyAccount = asyncHandler(async (req, res) => {
  const summary = await deleteUserAccount(req.user._id);
  res.json({
    message: "Your account and all associated data have been permanently deleted.",
    summary,
  });
});

// @route POST /api/auth/test-push  (protected)
// Diagnostic: send a push to the caller's OWN saved token and report exactly
// what happened, so we can tell which layer of FCM is failing.
const testPush = asyncHandler(async (req, res) => {
  if (!admin.apps.length) {
    res.status(503);
    throw new Error("Server push is disabled: FIREBASE_SERVICE_ACCOUNT is not configured on the backend.");
  }

  const me = await User.findById(req.user._id).select("fcmToken name");
  if (!me.fcmToken) {
    res.status(400);
    throw new Error("No FCM token is saved for your account. Open the app and enable notifications first (grant permission so a token is generated).");
  }

  try {
    const messageId = await admin.messaging().send({
      token: me.fcmToken,
      notification: {
        title: "🔔 Sahayam test push",
        body: `It works, ${me.name || "there"}! Your device can receive alerts.`,
      },
    });
    res.json({ ok: true, messageId, tokenPreview: `${me.fcmToken.slice(0, 12)}…` });
  } catch (err) {
    // Return (don't throw) so the real FCM error code reaches the client.
    res.status(502).json({
      ok: false,
      error: err.errorInfo?.code || err.code || "unknown",
      message: err.message,
      hint: "registration-token-not-registered → the saved token is stale; re-enable notifications. mismatched-credential / sender-id-mismatch → the web VAPID key and the server service account belong to different Firebase projects.",
    });
  }
});

// @route POST /api/auth/send-phone-otp  (protected, rate-limited)
// Issues a fresh SMS code to the logged-in user's registered phone number.
const sendPhoneOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.phone || user.phone === "Not Provided" || !/^\+91[6-9]\d{9}$/.test(user.phone)) {
    res.status(400);
    throw new Error("Add a valid mobile number to your profile before verifying it.");
  }
  if (user.isPhoneVerified) {
    return res.json({ message: "Your phone number is already verified." });
  }

  const code = generateOtp();
  user.phoneVerificationCode = code;
  user.phoneVerificationExpiry = otpExpiry();
  await user.save();

  // sendSMS gracefully simulates (logs) when Twilio isn't configured.
  sendSMS(user.phone, `Your Sahayam verification code is ${code}. It expires in 10 minutes.`)
    .catch((err) => console.error("sendPhoneOTP SMS failed:", err.message));

  res.json({ message: "Verification code sent to your phone." });
});

// @route POST /api/auth/verify-phone-otp  (protected, rate-limited)
const verifyPhoneOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { valid, reason } = checkOtp({
    code: req.body.code,
    expected: user.phoneVerificationCode,
    expiresAt: user.phoneVerificationExpiry,
  });
  if (!valid) {
    res.status(400);
    throw new Error(reason);
  }

  user.isPhoneVerified = true;
  user.phoneVerificationCode = undefined;
  user.phoneVerificationExpiry = undefined;
  await user.save();

  res.json({ message: "Phone number verified!", isPhoneVerified: true });
});

const resendVerification = asyncHandler(async (req, res) => {
  const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "If that account exists, a new code has been sent." });
  if (user.isEmailVerified) return res.json({ message: "Email is already verified." });

  user.emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const { sendVerificationEmail } = require("../utils/sendEmail");
  sendVerificationEmail(user.email, user.name, user.emailVerificationToken).catch(console.error);
  res.json({ message: "Verification code resent." });
});

const submitKYC = asyncHandler(async (req, res) => {
  const { documentType } = req.body;
  const allowed = ["aadhaar", "passport", "driving_license"];
  if (!documentType || !allowed.includes(documentType)) {
    res.status(400);
    throw new Error("Valid document type is required");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("Document image is required");
  }

  const { cloudinary } = require("../config/cloudinary");
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "sahayam_kyc", resource_type: "image" },
      (err, r) => (err ? reject(err) : resolve(r)),
    );
    stream.end(req.file.buffer);
  });

  await User.findByIdAndUpdate(req.user._id, {
    "kycStatus.documentType": documentType,
    "kycStatus.kycDocumentUrl": result.secure_url,
    "kycStatus.kycSubmittedAt": new Date(),
    "kycStatus.documentVerified": false,
  });

  res.json({ message: "KYC document submitted for review. We'll verify within 48 hours." });
});

// How rare is this donor's blood group within 5 km?
const donorRarity = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).select("bloodGroup location isAvailable");
  if (!me.bloodGroup) return res.json({ count: 0, bloodGroup: null });

  const hasCoords = me.location?.coordinates?.[0] !== 0 || me.location?.coordinates?.[1] !== 0;

  let count = 0;
  if (hasCoords) {
    count = await User.countDocuments({
      bloodGroup: me.bloodGroup,
      isAvailable: true,
      _id: { $ne: me._id },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: me.location.coordinates },
          $maxDistance: 5000,
        },
      },
    });
  }

  res.json({ count, bloodGroup: me.bloodGroup });
});

const updateEmergencyContacts = asyncHandler(async (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    res.status(400);
    throw new Error("contacts must be an array");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { emergencyContacts: contacts.slice(0, 5) },
    { new: true, select: "emergencyContacts" },
  );
  res.json(user.emergencyContacts);
});

const familySafetyNet = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).select("emergencyContacts location");
  if (!me.emergencyContacts?.length) return res.json([]);

  const hasCoords = me.location?.coordinates?.[0] !== 0 || me.location?.coordinates?.[1] !== 0;

  const results = await Promise.all(
    me.emergencyContacts.map(async (c) => {
      const contact = c.toObject();
      if (!contact.bloodGroup || !hasCoords) return { ...contact, donorCount: 0 };

      const donorCount = await User.countDocuments({
        bloodGroup: contact.bloodGroup,
        isAvailable: true,
        _id: { $ne: req.user._id },
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: me.location.coordinates },
            $maxDistance: 10000,
          },
        },
      });
      return { ...contact, donorCount };
    }),
  );

  res.json(results);
});

const donorPassport = asyncHandler(async (req, res) => {
  const Donation = require("../models/Donation");
  const user = await User.findById(req.user._id);
  const recent = await Donation.find({
    $or: [
      { donorId: req.user._id, status: "fulfilled" },
      { receiverId: req.user._id, status: "fulfilled" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title bloodGroup createdAt");

  const eligible = user.isBloodEligible();
  const daysUntilEligible = eligible
    ? 0
    : Math.ceil(
        (new Date(user.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) /
          (24 * 60 * 60 * 1000),
      );

  res.json({
    name: user.name,
    bloodGroup: user.bloodGroup,
    donationsCount: user.donationsCount,
    points: user.points,
    rank: user.rank,
    rating: user.rating,
    isVerified: user.kycStatus?.documentVerified,
    lastDonationDate: user.lastDonationDate,
    eligible,
    daysUntilEligible,
    thanksReceived: user.thanksReceived?.slice(-3) || [],
    recentDonations: recent,
  });
});

const logOfflineDonation = asyncHandler(async (req, res) => {
  const { donationDate } = req.body;
  const date = donationDate ? new Date(donationDate) : new Date();

  if (isNaN(date.getTime()) || date > new Date()) {
    res.status(400);
    throw new Error("Provide a valid date that is not in the future");
  }

  const { calculateRank, getPointsForAction } = require("../utils/gamification");
  const user = await User.findById(req.user._id);
  user.lastDonationDate = date;
  user.donationsCount   = (user.donationsCount || 0) + 1;
  user.points          += getPointsForAction("SUCCESSFUL_DONATION");
  user.rank             = calculateRank(user.points);
  await user.save();

  const { generateToken: _gt, ...userData } = user.toObject();
  delete userData.password;
  res.json({ ...userData, token: req.user.token });
});

const updateNotificationPrefs = asyncHandler(async (req, res) => {
  const allowed = ["emergencyNearby", "campReminders", "weeklyDigest", "requestApproved"];
  const update  = {};
  for (const key of allowed) {
    if (typeof req.body[key] === "boolean") {
      update[`notificationPrefs.${key}`] = req.body[key];
    }
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: update },
    { new: true, select: "-password" },
  );
  res.json(user);
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
  resendVerification,
  sendPhoneOTP,
  verifyPhoneOTP,
  deleteMyAccount,
  testPush,
  submitKYC,
  donorRarity,
  updateEmergencyContacts,
  familySafetyNet,
  donorPassport,
  logOfflineDonation,
  updateNotificationPrefs,
};