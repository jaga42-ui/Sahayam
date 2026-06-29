/**
 * Demo seed — drops synthetic donors around a city centre so the radar map and
 * the escalation engine have something to work with in a live demo.
 *
 *   node scripts/seedDonors.js                 # 200 donors around Bengaluru
 *   node scripts/seedDonors.js 300 12.97 77.59 # count + lat + lng
 *
 * Seeded accounts use the email domain @seed.sahayam.local so they can be wiped
 * with `node scripts/seedDonors.js --clear` without touching real users.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { ALL_GROUPS } = require("../utils/bloodCompat");

const SEED_DOMAIN = "@seed.sahayam.local";

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Scatter a point up to ~maxKm away from a centre (rough but fine for demos).
function jitter(lat, lng, maxKm = 45) {
  const r = (Math.random() * maxKm) / 111; // ~111 km per degree
  const theta = Math.random() * 2 * Math.PI;
  return [lng + r * Math.cos(theta), lat + r * Math.sin(theta)];
}

async function run() {
  const args = process.argv.slice(2);
  await mongoose.connect(process.env.MONGO_URI);

  if (args[0] === "--clear") {
    const { deletedCount } = await User.deleteMany({ email: { $regex: `${SEED_DOMAIN}$` } });
    console.log(`🧹 Removed ${deletedCount} seeded donors.`);
    return mongoose.disconnect();
  }

  const count = Number(args[0]) || 200;
  const centerLat = Number(args[1]) || 12.9716;
  const centerLng = Number(args[2]) || 77.5946;

  await User.deleteMany({ email: { $regex: `${SEED_DOMAIN}$` } }); // idempotent reseed

  const now = Date.now();
  const docs = Array.from({ length: count }, (_, i) => {
    const [lng, lat] = jitter(centerLat, centerLng);
    // ~20% recently donated → ineligible, so the eligibility filter is visible.
    const recentlyDonated = Math.random() < 0.2;
    return {
      name: `Donor ${i + 1}`,
      email: `donor${i + 1}${SEED_DOMAIN}`,
      password: "SeedPass123!", // hashed by the User pre-save hook
      phone: `+919${Math.floor(100000000 + Math.random() * 899999999)}`,
      activeRole: "donor",
      bloodGroup: rand(ALL_GROUPS),
      isAvailable: Math.random() < 0.85,
      isEmailVerified: true,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      lastDonationDate: recentlyDonated
        ? new Date(now - Math.floor(Math.random() * 80) * 24 * 60 * 60 * 1000)
        : undefined,
      location: { type: "Point", coordinates: [lng, lat] },
      addressText: "Seed City",
    };
  });

  // Use create() (not insertMany) so the password-hashing hook runs per doc.
  await User.create(docs);

  console.log(`🌱 Seeded ${count} donors around [${centerLat}, ${centerLng}].`);
  console.log(`   Blood groups: ${ALL_GROUPS.join(", ")}`);
  console.log(`   Wipe later with: node scripts/seedDonors.js --clear`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
