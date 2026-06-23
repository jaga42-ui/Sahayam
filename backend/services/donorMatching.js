/**
 * Donor matching — the heart of the routing engine.
 *
 * One query path used by every caller (radar display, emergency blast,
 * escalation cron, emergency donation fan-out) so matching is consistent and
 * medically correct everywhere. Uses a `$geoNear` aggregation so results come
 * back already sorted by distance and carry a real `distance` field (metres),
 * which the map UI renders directly.
 *
 * A candidate donor must be:
 *   - role "donor" and currently available
 *   - within the search radius of the requester
 *   - not the requester, and not someone we have already pinged
 *   - for blood requests: a compatible blood group AND eligible to donate
 *     (whole-blood donors must wait DONATION_COOLDOWN_DAYS between donations)
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const { getCompatibleDonorGroups } = require("../utils/bloodCompat");

// Whole-blood donors are ineligible until this many days after their last donation.
const DONATION_COOLDOWN_DAYS = 90;

function toObjectIds(ids = []) {
  return ids
    .filter(Boolean)
    .map((id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id))));
}

/**
 * Find donors to ping for a request.
 *
 * @param {Object}   opts
 * @param {number}   opts.lng            requester longitude
 * @param {number}   opts.lat            requester latitude
 * @param {number}   opts.radiusMeters   search radius in metres
 * @param {string}  [opts.category]      "blood" applies compatibility + eligibility
 * @param {string}  [opts.bloodGroup]    patient's required group (blood only)
 * @param {Array}   [opts.excludeIds]    user ids to skip (requester + already pinged)
 * @param {boolean} [opts.requireAvailable=true]  honour the donor availability toggle
 * @param {number}  [opts.limit=200]     hard cap to protect memory
 * @returns {Promise<Array>} donors with a numeric `distance` field, nearest first
 */
async function findEligibleDonors({
  lng,
  lat,
  radiusMeters,
  category,
  bloodGroup,
  excludeIds = [],
  requireAvailable = true,
  limit = 200,
}) {
  if (typeof lng !== "number" || typeof lat !== "number" || Number.isNaN(lng) || Number.isNaN(lat)) {
    return [];
  }

  const match = {
    activeRole: "donor",
    _id: { $nin: toObjectIds(excludeIds) },
  };
  if (requireAvailable) match.isAvailable = true;

  if (category === "blood") {
    const compatible = getCompatibleDonorGroups(bloodGroup);
    if (compatible.length > 0) {
      match.bloodGroup = { $in: compatible };
    }
    // Eligibility: never donated, or last donation is older than the cooldown.
    const cooldownCutoff = new Date(Date.now() - DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    match.$or = [
      { lastDonationDate: { $exists: false } },
      { lastDonationDate: null },
      { lastDonationDate: { $lte: cooldownCutoff } },
    ];
  }

  const donors = await User.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance", // metres
        maxDistance: radiusMeters,
        spherical: true,
        query: match,
      },
    },
    { $limit: limit },
    {
      $project: {
        name: 1,
        email: 1,
        profilePic: 1,
        bloodGroup: 1,
        addressText: 1,
        phone: 1,
        location: 1,
        rank: 1,
        rating: 1,
        fcmToken: 1,
        fcmTokens: 1,
        distance: 1,
        isEmailVerified: 1,
        isPhoneVerified: 1,
        "kycStatus.documentVerified": 1,
      },
    },
  ]);

  return donors;
}

/**
 * Geo-free compatible-donor lookup — the email safety net.
 *
 * A donor who has not shared GPS is still at the default [0,0], so `$geoNear`
 * never returns them. On a young user base that means an SOS can reach nobody.
 * Email needs no location, so we fall back to every compatible, eligible,
 * available donor that has an email — letting them judge distance from the map
 * link in the alert. Snoozed donors are respected (isAvailable only).
 */
async function findCompatibleDonors({ category, bloodGroup, excludeIds = [], limit = 150 }) {
  const match = {
    activeRole: "donor",
    isAvailable: true,
    email: { $exists: true, $ne: "" },
    _id: { $nin: toObjectIds(excludeIds) },
  };

  if (category === "blood") {
    const compatible = getCompatibleDonorGroups(bloodGroup);
    if (compatible.length > 0) match.bloodGroup = { $in: compatible };
    const cooldownCutoff = new Date(Date.now() - DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    match.$or = [
      { lastDonationDate: { $exists: false } },
      { lastDonationDate: null },
      { lastDonationDate: { $lte: cooldownCutoff } },
    ];
  }

  return User.find(match).select("name email bloodGroup").limit(limit).lean();
}

module.exports = {
  DONATION_COOLDOWN_DAYS,
  findEligibleDonors,
  findCompatibleDonors,
};
