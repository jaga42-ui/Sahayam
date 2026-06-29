const asyncHandler = require("express-async-handler");
const Donation = require("../models/Donation");
const User = require("../models/User");
const admin = require("firebase-admin");

const { sendPostAlertEmail } = require("../utils/sendEmail");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { findEligibleDonors, findCompatibleDonors } = require("../services/donorMatching");
const { notifyDonors } = require("../utils/notify");

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin Initialized successfully in Donations");
    } else {
      console.log(
        "⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Push notifications disabled.",
      );
    }
  } catch (error) {
    console.log("⚠️ Firebase Admin setup failed:", error.message);
  }
}

const { cloudinary } = require("../config/cloudinary");

const createDonation = asyncHandler(async (req, res) => {
  const {
    listingType,
    title,
    description,
    quantity,
    addressText,
    condition,
    foodType,
    expiryDate,
    pickupTime,
    bookAuthor,
    isEmergency,
    bloodGroup,
    lat,
    lng,
    donationWindow,
  } = req.body;

  // Sahayam is a blood-emergency network: every listing is a blood request.
  const category = "blood";

  let imageUrl = "";

  if (req.file) {
    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "sahayam_uploads", width: 800, crop: "limit" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      const result = await uploadPromise;
      imageUrl = result.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError);
      return res.status(500).json({ message: "Image upload failed. Please try again." });
    }
  }

  const pickupPIN = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit completion code

  const rawLat = parseFloat(lat);
  const rawLng = parseFloat(lng);
  const parsedLat = Number.isFinite(rawLat) ? rawLat : 0;
  const parsedLng = Number.isFinite(rawLng) ? rawLng : 0;

  const isCriticalEmergency = isEmergency === "true" || isEmergency === true;

  // An emergency SOS fans out push + email to real donors, so it has to be real.
  // Reject garbage up front instead of broadcasting it: a valid blood group, a
  // genuinely pinned location (not the [0,0] default a missing GPS pin falls
  // back to), and basic content.
  if (isCriticalEmergency) {
    const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const hasRealCoords =
      Number.isFinite(rawLat) && Number.isFinite(rawLng) &&
      Math.abs(rawLat) <= 90 && Math.abs(rawLng) <= 180 &&
      !(rawLat === 0 && rawLng === 0);
    const units = parseInt(quantity, 10);

    const missing = [];
    if (!VALID_BLOOD_GROUPS.includes(String(bloodGroup || "").toUpperCase())) missing.push("a valid blood group");
    if (!hasRealCoords) missing.push("a pinned location");
    if (!String(title || "").trim()) missing.push("a title");
    if (!String(addressText || "").trim()) missing.push("a location name");
    if (!Number.isInteger(units) || units < 1 || units > 20) missing.push("a unit count between 1 and 20");

    if (missing.length) {
      res.status(400);
      throw new Error(`This SOS can't be broadcast — it needs ${missing.join(", ")}.`);
    }
  }

  // Prevent SOS spam: reject if user already has an active emergency post in the last 30 minutes
  if (isCriticalEmergency) {
    const recentSOS = await Donation.findOne({
      donorId: req.user._id,
      isEmergency: true,
      status: { $in: ["active", "pending"] },
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });
    if (recentSOS) {
      res.status(429);
      throw new Error("You already have an active SOS posted in the last 30 minutes.");
    }
  }

  const newDonation = await Donation.create({
    donorId: req.user._id,
    listingType: listingType || "donation",
    category,
    title,
    description,
    quantity,
    condition,
    foodType,
    expiryDate,
    pickupTime,
    bookAuthor,
    pickupPIN,
    image: imageUrl,
    isEmergency: isCriticalEmergency,
    bloodGroup,
    donationWindow: donationWindow || undefined,
    location: {
      type: "Point",
      coordinates: [parsedLng, parsedLat],
      addressText,
    },
    verifiedByInstitution: req.user.activeRole === "ngo" ? req.user._id : null,
  });

  const populatedDonation = await Donation.findById(newDonation._id)
    .populate("donorId", "name profilePic addressText")
    .populate("requestedBy", "name profilePic");

  const io = req.app.get("io");
  if (io) {
    io.emit("new_listing", populatedDonation);
  }

  // Emergency listings fan out through the shared routing engine: compatible,
  // eligible, nearby donors get a push + email alert in one pass.
  if (isCriticalEmergency && parsedLat && parsedLng) {
    try {
      const donors = await findEligibleDonors({
        lng: parsedLng,
        lat: parsedLat,
        radiusMeters: 50000,
        category,
        bloodGroup,
        excludeIds: [req.user._id],
        requireAvailable: false, // a posted listing should reach everyone nearby
        limit: 200,
      });

      const alert = {
        title: `🚨 CRITICAL EMERGENCY: ${bloodGroup || "Help"} Needed!`,
        body: `${title} near ${addressText}. Open Sahayam to respond now!`,
        bloodGroup,
        isEmergency: isCriticalEmergency,
        meta: { title },
      };

      const delivery = await notifyDonors(donors, alert);
      console.log(
        `🔥 SOS listing ${newDonation._id}: reached ${delivery.push} devices + ${delivery.email} emails across ${donors.length} nearby donors.`,
      );

      // 👉 EMAIL SAFETY NET: donors who haven't shared GPS sit at the default
      // [0,0] and are invisible to $geoNear — so on a young user base an SOS can
      // reach nobody. When the nearby pool is thin, email the broader compatible
      // pool (excluding everyone already alerted) so the alert never goes nowhere.
      const GEO_HEALTHY = 5;
      if (donors.length < GEO_HEALTHY) {
        const net = await findCompatibleDonors({
          category,
          bloodGroup,
          excludeIds: [req.user._id, ...donors.map((d) => d._id)],
          limit: 150,
        });
        if (net.length > 0) {
          const r = await notifyDonors(net, alert);
          console.log(
            `📧 SOS listing ${newDonation._id}: email safety-net reached ${r.email} additional donor(s).`,
          );
        }
      }
    } catch (dispatchError) {
      console.error("Failed to dispatch SOS notifications:", dispatchError);
    }
  }

  res.status(201).json(populatedDonation);
});

const getDonations = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const skip = (page - 1) * limit;

  let query = { status: { $nin: ["fulfilled", "hidden"] } };

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 50000,
      },
    };
  }

  // 👉 THE FIX: Over-fetch by 1 item to determine 'hasMore' without slow countDocuments()
  let dbQuery = Donation.find(query)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  if (!lat || !lng) {
    dbQuery = dbQuery.sort({ createdAt: -1 });
  }

  let donations = await dbQuery
    .skip(skip)
    .limit(limit + 1); 

  const hasMore = donations.length > limit;
  if (hasMore) donations.pop(); // Remove the extra item

  res.json({ donations, hasMore });
});

const getNearbyFeed = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const skip = (page - 1) * limit;

  // Non-emergency posts auto-expire after 72 h; emergency posts always show.
  const expiryThreshold = new Date(Date.now() - 72 * 60 * 60 * 1000);

  let donations = await Donation.find({
    category: "blood",
    status: { $nin: ["fulfilled", "hidden", "expired"] },
    $or: [
      { isEmergency: true },
      { createdAt: { $gte: expiryThreshold } },
    ],
  })
    .populate(
      "donorId",
      "name profilePic addressText points rank rating totalRatings phone kycStatus isVerified",
    )
    .populate("requestedBy", "name profilePic")
    .sort({ isEmergency: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit + 1);

  const hasMore = donations.length > limit;
  if (hasMore) donations.pop();

  res.json({ donations, hasMore });
});

const requestItem = asyncHandler(async (req, res) => {
  let donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Item not found");
  }

  if (donation.status === "fulfilled") {
    res.status(400);
    throw new Error("This mission has already been completed.");
  }

  if (donation.donorId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot request your own item");
  }
  if (donation.requestedBy.some(id => id.toString() === req.user._id.toString())) {
    res.status(400);
    throw new Error("You have already requested this item");
  }

  donation.requestedBy.push(req.user._id);
  await donation.save();

  const updatedDonation = await Donation.findById(donation._id)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  const io = req.app.get("io");
  if (io) {
    io.to(donation.donorId.toString()).emit("new_request_notification", {
      donationId: donation._id,
      title: donation.title,
      requesterName: req.user.name,
    });

    io.emit("listing_updated", updatedDonation);
  }

  res.status(200).json({
    message: "Request sent to donor!",
    requestedBy: donation.requestedBy,
  });
});

const approveRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  let donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Item not found");
  }
  if (donation.donorId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only the donor can approve requests");
  }

  if (donation.status === "fulfilled") {
    res.status(400);
    throw new Error("This mission has already been completed.");
  }

  if (!donation.requestedBy.some(id => id.toString() === receiverId.toString())) {
    res.status(400);
    throw new Error("This user is not on the request list");
  }

  donation.receiverId = receiverId;
  donation.status = "pending";
  await donation.save();

  const updatedDonation = await Donation.findById(donation._id)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  const chatRoomId = `${donation._id}_${receiverId}`;

  const io = req.app.get("io");
  if (io) {
    io.to(receiverId.toString()).emit("request_approved", {
      donationId: donation._id,
      title: donation.title,
      donorName: req.user.name,
      chatRoomId: chatRoomId,
    });

    io.emit("listing_updated", updatedDonation);
  }

  res.status(200).json({
    message: "Request approved successfully!",
    chatRoomId,
    donation: updatedDonation,
  });
});

const acceptSOS = asyncHandler(async (req, res) => {
  const donationId = req.params.id;
  const heroId = req.user._id;

  let sosRequest = await Donation.findById(donationId).populate(
    "donorId",
    "name phone profilePic",
  );

  if (!sosRequest) {
    res.status(404);
    throw new Error("Emergency request not found.");
  }
  if (!sosRequest.isEmergency) {
    res.status(400);
    throw new Error("This is not an emergency listing.");
  }

  if (sosRequest.status === "fulfilled") {
    res.status(400);
    throw new Error("This emergency has already been resolved!");
  }

  if (sosRequest.donorId._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot respond to your own SOS");
  }

  // 👉 ATOMIC CLAIM: only one hero can win the race. The conditional update
  // succeeds for whoever reaches the DB first; concurrent accepts match zero
  // documents (status already "pending") and get a clean "already handled".
  const claimed = await Donation.findOneAndUpdate(
    {
      _id: donationId,
      isEmergency: true,
      status: { $nin: ["pending", "fulfilled", "hidden", "expired"] },
    },
    {
      $set: { receiverId: heroId, status: "pending" },
      $addToSet: { requestedBy: heroId },
    },
    { new: true },
  );

  if (!claimed) {
    res.status(409);
    throw new Error("Another hero just responded to this emergency.");
  }

  const updatedDonation = await Donation.findById(donationId)
    .populate("donorId", "name profilePic addressText phone")
    .populate("requestedBy", "name profilePic");

  const io = req.app.get("io");
  if (io) {
    io.emit("listing_updated", updatedDonation);
  }

  res.status(200).json(updatedDonation);
});

const markFulfilled = asyncHandler(async (req, res) => {
  const { pin, rating } = req.body;
  const donationId = req.params.id;
  const donation = await Donation.findById(donationId);

  if (!donation || donation.pickupPIN !== pin) {
    res.status(400);
    throw new Error("Incorrect OTP");
  }

  donation.status = "fulfilled";
  await donation.save();

  const { calculateRank, getPointsForAction } = require("../utils/gamification");

  // The physical blood donor differs by listing type: for a "request" (someone
  // needing blood) the hero who gave is the receiver; otherwise it's the poster.
  const bloodDonorId =
    donation.category === "blood" && donation.listingType === "request"
      ? donation.receiverId
      : donation.donorId;

  const donor = await User.findById(donation.donorId);
  if (donor) {
    donor.points += getPointsForAction("SUCCESSFUL_DONATION");
    donor.donationsCount += 1;

    if (donor.donationsCount === 1 || donor.donationsCount === 5 || donor.donationsCount === 10) {
      const { sendCertificateEmail } = require('../utils/sendEmail');
      sendCertificateEmail(donor.email, donor.name, donor.donationsCount).catch(console.error);
    }

    donor.rank = calculateRank(donor.points);
    await donor.save();

    const MILESTONES = [1, 5, 10, 25, 50, 100];
    if (MILESTONES.includes(donor.donationsCount)) {
      const ioRef = req.app.get("io");
      if (ioRef) {
        ioRef.to(donation.donorId.toString()).emit("milestone_reached", {
          count: donor.donationsCount,
        });
      }
    }
  }

  // Start the eligibility cooldown for whoever actually donated blood.
  if (donation.category === "blood" && bloodDonorId) {
    await User.findByIdAndUpdate(bloodDonorId, { lastDonationDate: new Date() });
  }

  if (donation.receiverId) {
    const receiver = await User.findById(donation.receiverId);
    if (!receiver) {
      return res.json({ message: "Handshake Successful", pointsEarned: 50 });
    }
    receiver.points += getPointsForAction('RECEIVE_DONATION');
    receiver.requestsCount += 1;
    receiver.rank = calculateRank(receiver.points);

    if (rating) {
      const newTotal = receiver.totalRatings + 1;
      const newAverage =
        (receiver.rating * receiver.totalRatings + Number(rating)) / newTotal;
      receiver.rating = Number(newAverage.toFixed(1));
      receiver.totalRatings = newTotal;
    }
    await receiver.save();
  }

  const io = req.app.get("io");
  if (io) {
    io.emit("listing_deleted", donation._id);
    const chatRoomId = `${donationId}_${donation.receiverId}`;
    io.to(chatRoomId).emit("chat_terminated", {
      message: "Thank you — this request is complete.",
    });
    // Prompt the recipient to send a thank-you to the donor
    if (donation.receiverId) {
      io.to(donation.receiverId.toString()).emit("donation_fulfilled_prompt", {
        donationId: donation._id,
        donationTitle: donation.title,
        donorName: donor?.name || "your donor",
      });
    }
  }

  res.json({ message: "Handshake Successful", pointsEarned: 50 });
});

// @route GET /api/donations/:id/handshake
// Real completion handshake: the requester (poster) sees the code; the donor
// enters it to confirm the donation actually happened. Replaces the old
// simulated QR. Only participants may access it.
const getHandshake = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id).select(
    "donorId receiverId requestedBy pickupPIN status title",
  );
  if (!donation) {
    res.status(404);
    throw new Error("Request not found.");
  }
  const me = req.user._id.toString();
  const isOwner = donation.donorId?.toString() === me;
  const isParticipant =
    isOwner ||
    donation.receiverId?.toString() === me ||
    (donation.requestedBy || []).some((id) => id.toString() === me);
  if (!isParticipant) {
    res.status(403);
    throw new Error("You're not part of this request.");
  }
  res.json({
    role: isOwner ? "owner" : "helper",
    code: isOwner ? donation.pickupPIN : null, // only the poster sees the code
    status: donation.status,
    title: donation.title,
  });
});

const getMyHistory = asyncHandler(async (req, res) => {
  const donations = await Donation.find({
    $or: [{ donorId: req.user._id }, { receiverId: req.user._id }],
  }).sort({ createdAt: -1 });
  res.json(donations);
});

const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation || donation.donorId.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized");
  }
  await donation.deleteOne();

  const io = req.app.get("io");
  if (io) {
    io.emit("listing_deleted", req.params.id);
  }

  res.json({ id: req.params.id });
});

const reportDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (donation.reports && donation.reports.includes(req.user._id)) {
    return res.status(400).json({ message: "You already reported this post." });
  }

  if (!donation.reports) donation.reports = [];
  donation.reports.push(req.user._id);

  if (donation.reports.length >= 3) {
    donation.status = "hidden";
  }

  await donation.save();

  if (donation.status === "hidden") {
    const io = req.app.get("io");
    if (io) io.emit("listing_deleted", donation._id);
  }

  res.json({
    message:
      "Post flagged for review. Thank you for keeping the community safe.",
  });
});

const triageSOS = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error("Text is required");
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500);
    throw new Error("Gemini API key is not configured");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  You are an Emergency Medical Triage AI for the Sahayam platform.
  Parse the following user message and extract details for an SOS alert.
  Return ONLY a valid JSON object with these exact keys:
  - title (A concise, urgent title)
  - description (A summary of the emergency)
  - bloodGroup (If mentioned, exact format like A+, O-. If not mentioned, return empty string)
  - addressText (The location or hospital mentioned)
  - isEmergency (boolean, usually true for SOS)

  Message: "${text}"
  `;

  try {
    const resultResponse = await model.generateContent(prompt);
    let resultText = resultResponse.response.text();
    
    // Strip markdown formatting if any
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error) {
    console.error("AI Triage Error:", error);
    res.status(500);
    throw new Error("Failed to parse AI request");
  }
});

const sendThankYou = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400);
    throw new Error("Message is required");
  }

  const donation = await Donation.findById(req.params.id).populate("donorId", "name _id");
  if (!donation) {
    res.status(404);
    throw new Error("Donation not found");
  }

  const isReceiver = donation.receiverId?.toString() === req.user._id.toString();
  const isRequester = donation.requestedBy?.some((id) => id.toString() === req.user._id.toString());
  if (!isReceiver && !isRequester) {
    res.status(403);
    throw new Error("Not authorized");
  }

  donation.thankYouMessage = { text: message.trim(), sentAt: new Date(), fromName: req.user.name };
  await donation.save();

  await User.findByIdAndUpdate(donation.donorId._id, {
    $push: {
      thanksReceived: {
        donationId: donation._id,
        message: message.trim(),
        from: req.user.name,
        createdAt: new Date(),
      },
    },
  });

  const io = req.app.get("io");
  if (io) {
    io.to(donation.donorId._id.toString()).emit("thank_you_received", {
      from: req.user.name,
      message: message.trim(),
      donationTitle: donation.title,
    });
  }

  res.json({ message: "Thank you sent!" });
});

const relistDonation = asyncHandler(async (req, res) => {
  const original = await Donation.findById(req.params.id);

  if (!original || original.donorId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (original.status === "hidden") {
    res.status(403);
    throw new Error("This listing was removed by moderation and cannot be re-listed");
  }

  if (!["expired", "fulfilled"].includes(original.status)) {
    res.status(400);
    throw new Error("Only expired or fulfilled listings can be re-listed");
  }

  const pickupPIN = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit completion code

  const relisted = await Donation.create({
    donorId:          original.donorId,
    listingType:      original.listingType,
    category:         original.category,
    title:            original.title,
    description:      original.description,
    quantity:         original.quantity,
    bloodGroup:       original.bloodGroup,
    isEmergency:      original.isEmergency,
    patientDetails:   original.patientDetails,
    hospitalRoomNumber: original.hospitalRoomNumber,
    donationWindow:   original.donationWindow,
    pickupPIN,
    location:         original.location,
    severityLevel:    original.severityLevel,
    status:           "active",
  });

  const populated = await Donation.findById(relisted._id)
    .populate("donorId", "name profilePic addressText phone");

  const io = req.app.get("io");
  if (io) io.emit("new_listing", populated);

  res.status(201).json(populated);
});

const receiverConfirm = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Not found");
  }

  if (donation.receiverId?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the matched receiver can confirm");
  }

  if (donation.status !== "pending") {
    res.status(400);
    throw new Error("Not in a confirmable state");
  }

  donation.receiverConfirmed = true;
  await donation.save();

  const io = req.app.get("io");
  if (io) {
    io.to(donation.donorId.toString()).emit("receiver_confirmed", {
      donationId:    donation._id,
      donationTitle: donation.title,
      receiverName:  req.user.name,
    });
  }

  res.json({ message: "Confirmed! The donor has been notified." });
});

module.exports = {
  createDonation,
  getDonations,
  getNearbyFeed,
  getMyHistory,
  deleteDonation,
  markFulfilled,
  getHandshake,
  requestItem,
  approveRequest,
  acceptSOS,
  reportDonation,
  triageSOS,
  sendThankYou,
  relistDonation,
  receiverConfirm,
};