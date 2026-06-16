const asyncHandler = require("express-async-handler");
const BloodCamp = require("../models/BloodCamp");

const getNearbyCamps = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const now = new Date();
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let query = {
    status: { $in: ["upcoming", "ongoing"] },
    date: { $gte: now, $lte: sevenDaysAhead },
  };

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: 50000,
      },
    };
  }

  const camps = await BloodCamp.find(query)
    .populate("organizer", "name organizationName profilePic")
    .sort({ date: 1 })
    .limit(20);

  res.json(camps);
});

const createCamp = asyncHandler(async (req, res) => {
  const { title, description, venue, date, endDate, bloodGroupsNeeded, targetUnits, contactPhone, contactName, lat, lng, addressText } = req.body;

  if (!title || !venue || !date) {
    res.status(400);
    throw new Error("Title, venue, and date are required");
  }

  const camp = await BloodCamp.create({
    organizer: req.user._id,
    title,
    description,
    venue,
    date: new Date(date),
    endDate: endDate ? new Date(endDate) : undefined,
    bloodGroupsNeeded: bloodGroupsNeeded || [],
    targetUnits: targetUnits ? Number(targetUnits) : undefined,
    contactPhone,
    contactName,
    location: {
      type: "Point",
      coordinates: [Number(lng) || 0, Number(lat) || 0],
      addressText,
    },
  });

  const populated = await BloodCamp.findById(camp._id).populate("organizer", "name organizationName profilePic");
  res.status(201).json(populated);
});

const registerForCamp = asyncHandler(async (req, res) => {
  const camp = await BloodCamp.findById(req.params.id);
  if (!camp) {
    res.status(404);
    throw new Error("Blood camp not found");
  }

  const alreadyRegistered = camp.registrations.some((id) => id.toString() === req.user._id.toString());
  if (alreadyRegistered) {
    camp.registrations = camp.registrations.filter((id) => id.toString() !== req.user._id.toString());
    await camp.save();
    return res.json({ registered: false, count: camp.registrations.length });
  }

  camp.registrations.push(req.user._id);
  await camp.save();
  res.json({ registered: true, count: camp.registrations.length });
});

module.exports = { getNearbyCamps, createCamp, registerForCamp };
