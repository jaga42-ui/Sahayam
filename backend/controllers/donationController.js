const asyncHandler = require("express-async-handler");
const Donation = require("../models/Donation");
const User = require("../models/User");
const admin = require("firebase-admin");

const { sendPostAlertEmail } = require("../utils/sendEmail");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { findEligibleDonors } = require("../services/donorMatching");
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
    category,
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
    severityLevel,
  } = req.body;

  let imageUrl = "";

  if (req.file) {
    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "hopelink_uploads", width: 800, crop: "limit" },
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

  const pickupPIN = Math.floor(1000 + Math.random() * 9000).toString();

  const parsedLat = parseFloat(lat) || 0;
  const parsedLng = parseFloat(lng) || 0;

  const isCriticalEmergency = isEmergency === "true" || isEmergency === true;

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
    location: {
      type: "Point",
      coordinates: [parsedLng, parsedLat],
      addressText,
    },
    severityLevel: severityLevel || (isCriticalEmergency ? "Code Yellow" : "Unverified"),
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

      const delivery = await notifyDonors(donors, {
        title: `🚨 CRITICAL EMERGENCY: ${bloodGroup || "Help"} Needed!`,
        body: `${title} near ${addressText}. Open Sahayam to respond now!`,
        bloodGroup,
        isEmergency: isCriticalEmergency,
        meta: { title },
      });

      console.log(
        `🔥 SOS listing ${newDonation._id}: reached ${delivery.push} devices + ${delivery.email} emails across ${donors.length} donors.`,
      );
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

  // 👉 THE FIX: Removed countDocuments() here as well
  let donations = await Donation.find({
    status: { $nin: ["fulfilled", "hidden"] },
  })
    .populate(
      "donorId",
      "name profilePic addressText points rank rating totalRatings phone",
    )
    .populate("requestedBy", "name profilePic")
    .sort({ createdAt: -1 })
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
      message: "Mission AccomplISHED. Secure channel closed.",
    });
  }

  res.json({ message: "Handshake Successful", pointsEarned: 50 });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find({})
    .select("name profilePic points rank donationsCount rating totalRatings")
    .sort({ points: -1 })
    .limit(10);
  res.json(topUsers);
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

const getCityLeaderboard = asyncHandler(async (req, res) => {
  const cityLeaderboard = await User.aggregate([
    { $match: { addressText: { $exists: true, $ne: "" }, points: { $gt: 0 } } },
    { $group: { _id: "$addressText", totalPoints: { $sum: "$points" }, donors: { $sum: 1 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: 10 }
  ]);
  res.json(cityLeaderboard);
});

const generateHeroStory = asyncHandler(async (req, res) => {
  const donation = await require("../models/Donation").findOne({ donorId: req.user.id, status: 'fulfilled' }).sort({ updatedAt: -1 });

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ story: `I am a proud volunteer on the Sahayam platform, ready to help my community. Join our local lifesaver network today! #SahayamApp` });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let prompt = "";
  if (donation) {
    prompt = `
    Write a grounded, humble, and realistic 2-sentence social media post for a user who just helped someone on the Sahayam app.
    Details of their help: Category: ${donation.category}. Title: ${donation.title}.
    Do not use exaggerated or overly dramatic language. Keep it deeply personal, calm, and genuine. 
    Mention the Sahayam app naturally. Do not include quotes.
    `;
  } else {
    prompt = `
    Write a grounded, humble, and realistic 2-sentence social media post for a registered volunteer on the Sahayam app.
    They are standing by to help their local community.
    Keep it deeply personal, calm, and genuine. Mention the Sahayam app naturally. Do not include quotes.
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    res.json({ story: result.response.text().trim() });
  } catch (error) {
    console.error("AI Hero Story Error:", error);
    res.json({ story: `I just helped fulfill a critical medical request on the Sahayam platform. Join our local lifesaver network today. #SahayamApp` });
  }
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

module.exports = {
  createDonation,
  getDonations,
  getNearbyFeed,
  getMyHistory,
  deleteDonation,
  markFulfilled,
  requestItem,
  approveRequest,
  acceptSOS,
  getLeaderboard,
  getCityLeaderboard,
  reportDonation,
  triageSOS,
  generateHeroStory,
};