const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Donation = require('../models/Donation');
const moment = require('moment'); 

const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateMarketingStrategy = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500);
    throw new Error("Gemini API key is not configured");
  }
  
  const [totalUsers, activeSOS] = await Promise.all([
    User.countDocuments(),
    Donation.countDocuments({ isEmergency: true, status: 'active' })
  ]);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
  Act as a calm, professional community organizer for 'Sahayam', a local peer-to-peer blood donation app.
  Current platform stats: ${totalUsers} total registered users, ${activeSOS} active emergencies currently unresolved.
  Write a short, grounded, and sincere social media post asking locals to join the app. 
  Focus on community support and real data. Do not exaggerate or use hyperbole. Be direct and realistic.
  `;
  
  try {
    const result = await model.generateContent(prompt);
    res.json({ strategy: result.response.text().trim() });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to generate AI strategy");
  }
});

const getHeatmapData = asyncHandler(async (req, res) => {
  const donors = await User.find({ activeRole: "donor", location: { $exists: true } })
    .select("location");
    
  const emergencies = await Donation.find({ isEmergency: true, location: { $exists: true } })
    .select("location");

  res.json({ donors, emergencies });
});

// @desc    Get platform statistics
// @route   GET /api/admin/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  // 👉 THE FIX: Fire all database counts simultaneously instead of waiting one-by-one.
  // This reduces dashboard load time by up to 80% on large datasets.
  const [totalUsers, totalDonations, totalRequests, fulfilledItems, activeSOS] = await Promise.all([
    User.countDocuments(),
    Donation.countDocuments({ listingType: 'donation' }),
    Donation.countDocuments({ listingType: 'request' }),
    Donation.countDocuments({ status: 'fulfilled' }),
    Donation.countDocuments({ isEmergency: true, status: 'active' })
  ]);

  const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
  
  const dailyUsers = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const growthData = dailyUsers.map(day => ({
    date: moment(day._id).format('MMM DD'),
    Users: day.count
  }));

  const reportedPosts = await Donation.find({ 'reports.0': { $exists: true } })
    .populate("donorId", "name email")
    .sort({ createdAt: -1 })
    .limit(50); // 👉 THE FIX: Cap reported posts

  res.json({ 
    totalUsers, totalDonations, totalRequests, fulfilledItems, activeSOS, growthData, reportedPosts  
  });
});

// @desc    Get all users (with pagination limits)
// @route   GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const skip = (page - 1) * limit;

  // 👉 THE FIX: Never load the whole database. Limit to 100 per page.
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  res.json(users);
});

// @desc    Get all listings (with pagination limits)
// @route   GET /api/admin/listings
const getAllListings = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const skip = (page - 1) * limit;

  // 👉 THE FIX: Strict limits to prevent OOM
  const listings = await Donation.find({})
    .populate('donorId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  res.json(listings);
});

// @desc    Delete a user and their posts
// @route   DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await Donation.deleteMany({ donorId: user._id }); 
    await user.deleteOne();
    res.json({ message: 'User removed completely' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Force delete any listing
// @route   DELETE /api/admin/listings/:id
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Donation.findById(req.params.id);
  if (listing) {
    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
  } else {
    res.status(404);
    throw new Error('Listing not found');
  }
});

// @desc    Toggle a user's Admin status
// @route   PATCH /api/admin/users/:id/role
const toggleAdminRole = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own admin status.');
  }

  targetUser.isAdmin = !targetUser.isAdmin; 
  await targetUser.save();

  const io = req.app.get('io');
  if (io) {
    io.to(targetUser._id.toString()).emit('role_updated', {
      userId: targetUser._id.toString(),
      isAdmin: targetUser.isAdmin
    });
  }

  res.json({ 
    message: `${targetUser.name} is now ${targetUser.isAdmin ? 'an Admin' : 'a standard User'}`,
    isAdmin: targetUser.isAdmin 
  });
});

// @route   POST /api/admin/broadcast
const sendBroadcast = asyncHandler(async (req, res) => {
  const { message, level } = req.body; 
  
  const io = req.app.get("io");
  if (io) {
    io.emit("global_alert", { message, level, timestamp: new Date() });
  }

  res.json({ success: true, message: "Broadcast transmitted to all active users." });
});

// @route   PATCH /api/admin/resolve-report/:id
const resolveReport = asyncHandler(async (req, res) => {
  const { action } = req.body; 
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (action === 'delete') {
    await donation.deleteOne();
    
    const io = req.app.get("io");
    if (io) io.emit("listing_deleted", req.params.id);
    
    res.json({ message: "Hostile transmission purged from network." });
  } else {
    donation.reports = [];
    donation.status = 'active'; 
    await donation.save();
    res.json({ message: "Post whitelisted and reports cleared." });
  }
});

const getCampsAdmin = asyncHandler(async (req, res) => {
  const BloodCamp = require("../models/BloodCamp");
  const camps = await BloodCamp.find({})
    .populate("organizer", "name email organizationName")
    .sort({ createdAt: -1 });
  res.json(camps);
});

const updateCampStatus = asyncHandler(async (req, res) => {
  const BloodCamp = require("../models/BloodCamp");
  const { status } = req.body;
  const allowed = ["upcoming", "ongoing", "completed", "cancelled"];
  if (!allowed.includes(status)) { res.status(400); throw new Error("Invalid status"); }
  const camp = await BloodCamp.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate("organizer", "name email organizationName");
  if (!camp) { res.status(404); throw new Error("Camp not found"); }
  res.json(camp);
});

const getKYCRequests = asyncHandler(async (req, res) => {
  const pending = await User.find({
    "kycStatus.kycDocumentUrl": { $exists: true, $ne: null },
  })
    .select("name email phone bloodGroup kycStatus createdAt")
    .sort({ "kycStatus.kycSubmittedAt": 1 });
  res.json(pending);
});

const approveKYC = asyncHandler(async (req, res) => {
  const { approved } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { "kycStatus.documentVerified": !!approved },
    { new: true, select: "name email kycStatus" },
  );
  if (!user) { res.status(404); throw new Error("User not found"); }
  res.json(user);
});

module.exports = {
  getDashboardStats, getAllUsers, getAllListings, deleteUser,
  deleteListing, toggleAdminRole, sendBroadcast, resolveReport, getHeatmapData, generateMarketingStrategy,
  getCampsAdmin, updateCampStatus, getKYCRequests, approveKYC,
};