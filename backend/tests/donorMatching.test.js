/**
 * Donor matching — does the single query path actually return the *right* people?
 *
 * These run real $geoNear aggregations against an in-memory Mongo, so they cover
 * the three medical/safety filters together: blood-group compatibility, the
 * 90-day donor cooldown, and the search radius (plus exclusions & availability).
 */
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const User = require("../models/User");
const { findEligibleDonors, DONATION_COOLDOWN_DAYS } = require("../services/donorMatching");

// Requester sits in central Bengaluru. 0.01° ≈ 1.1 km, so we can place donors at
// predictable distances.
const ORIGIN = { lng: 77.5946, lat: 12.9716 };

function at(lngOffset, latOffset) {
  return { type: "Point", coordinates: [ORIGIN.lng + lngOffset, ORIGIN.lat + latOffset] };
}

let seq = 0;
async function makeDonor(overrides = {}) {
  seq += 1;
  return User.create({
    name: `d${seq}`,
    email: `d${seq}@t.test`,
    password: "x",
    activeRole: "donor",
    isAvailable: true,
    bloodGroup: "O-",
    location: at(0.01, 0.01), // ~1.5 km away by default
    ...overrides,
  });
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("blood-group compatibility", () => {
  test("an A+ patient gets only A+, A-, O+, O- donors", async () => {
    await makeDonor({ bloodGroup: "A+" });
    await makeDonor({ bloodGroup: "A-" });
    await makeDonor({ bloodGroup: "O+" });
    await makeDonor({ bloodGroup: "O-" });
    await makeDonor({ bloodGroup: "B+" });   // incompatible
    await makeDonor({ bloodGroup: "AB+" });  // incompatible

    const donors = await findEligibleDonors({
      ...ORIGIN,
      radiusMeters: 10000,
      category: "blood",
      bloodGroup: "A+",
    });

    const groups = donors.map((d) => d.bloodGroup).sort();
    expect(groups).toEqual(["A+", "A-", "O+", "O-"]);
  });

  test("O- (hardest to match) only ever receives from O-", async () => {
    await makeDonor({ bloodGroup: "O-" });
    await makeDonor({ bloodGroup: "O+" });
    await makeDonor({ bloodGroup: "A-" });

    const donors = await findEligibleDonors({
      ...ORIGIN,
      radiusMeters: 10000,
      category: "blood",
      bloodGroup: "O-",
    });

    expect(donors.map((d) => d.bloodGroup)).toEqual(["O-"]);
  });
});

describe("donor cooldown (eligibility)", () => {
  test("a donor who gave blood within the cooldown is locked out", async () => {
    await makeDonor({ bloodGroup: "O-", lastDonationDate: daysAgo(DONATION_COOLDOWN_DAYS - 5) });

    const donors = await findEligibleDonors({
      ...ORIGIN,
      radiusMeters: 10000,
      category: "blood",
      bloodGroup: "O-",
    });

    expect(donors).toHaveLength(0);
  });

  test("a donor past the cooldown, or who never donated, is eligible", async () => {
    await makeDonor({ bloodGroup: "O-", lastDonationDate: daysAgo(DONATION_COOLDOWN_DAYS + 5) });
    await makeDonor({ bloodGroup: "O-" }); // never donated -> no lastDonationDate

    const donors = await findEligibleDonors({
      ...ORIGIN,
      radiusMeters: 10000,
      category: "blood",
      bloodGroup: "O-",
    });

    expect(donors).toHaveLength(2);
  });
});

describe("radius, exclusions & availability", () => {
  test("donors outside the radius are not returned, nearest comes first", async () => {
    const near = await makeDonor({ location: at(0.005, 0.005) });   // ~0.8 km
    const mid = await makeDonor({ location: at(0.03, 0.03) });      // ~4.7 km
    await makeDonor({ location: at(0.2, 0.2) });                    // ~31 km, excluded

    const donors = await findEligibleDonors({ ...ORIGIN, radiusMeters: 6000 });

    expect(donors.map((d) => d._id.toString())).toEqual([
      near._id.toString(),
      mid._id.toString(),
    ]);
    expect(donors[0].distance).toBeLessThan(donors[1].distance);
  });

  test("excluded ids (requester + already-pinged) are skipped", async () => {
    const keep = await makeDonor();
    const pinged = await makeDonor();

    const donors = await findEligibleDonors({
      ...ORIGIN,
      radiusMeters: 10000,
      excludeIds: [pinged._id],
    });

    expect(donors.map((d) => d._id.toString())).toEqual([keep._id.toString()]);
  });

  test("unavailable donors are skipped when availability is required", async () => {
    await makeDonor({ isAvailable: false });
    const ready = await makeDonor({ isAvailable: true });

    const donors = await findEligibleDonors({ ...ORIGIN, radiusMeters: 10000 });

    expect(donors.map((d) => d._id.toString())).toEqual([ready._id.toString()]);
  });

  test("invalid coordinates return an empty list instead of throwing", async () => {
    await makeDonor();
    const donors = await findEligibleDonors({ lng: NaN, lat: NaN, radiusMeters: 10000 });
    expect(donors).toEqual([]);
  });
});
