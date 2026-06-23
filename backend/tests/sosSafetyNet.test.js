/**
 * SOS email safety-net — proves the highest-risk delivery gap is closed.
 *
 * A donor who has never shared GPS sits at the default location [0,0], so a
 * $geoNear from a real city never returns them. Because the SOS email list was
 * derived from the geo-matched donors, an alert on a young user base could reach
 * NOBODY. findCompatibleDonors() is the geo-free fallback that fixes this — and
 * it must still honour compatibility, the 90-day cooldown, availability, email
 * presence, and exclusions so we don't spam the wrong people.
 */
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const User = require("../models/User");
const { findEligibleDonors, findCompatibleDonors, DONATION_COOLDOWN_DAYS } = require("../services/donorMatching");

// Requester sits in central Bengaluru.
const ORIGIN = { lng: 77.5946, lat: 12.9716 };
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

let seq = 0;
// NOTE: no `location` set on purpose → schema default [0,0] (a donor who never
// opened the radar / never shared GPS).
async function makeGpslessDonor(overrides = {}) {
  seq += 1;
  return User.create({
    name: `d${seq}`,
    email: `d${seq}@t.test`,
    password: "x",
    activeRole: "donor",
    isAvailable: true,
    bloodGroup: "O-",
    ...overrides,
  });
}

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("the gap it closes", () => {
  test("a GPS-less donor is invisible to geo-matching but reachable by the safety net", async () => {
    await makeGpslessDonor({ bloodGroup: "O-" });

    // The bug: even at a 50km radius, $geoNear from Bengaluru can't see a donor at [0,0].
    const geo = await findEligibleDonors({
      ...ORIGIN, radiusMeters: 50000, category: "blood", bloodGroup: "O-",
    });
    expect(geo).toHaveLength(0);

    // The fix: the geo-free net reaches them so the SOS doesn't go nowhere.
    const net = await findCompatibleDonors({ category: "blood", bloodGroup: "O-", excludeIds: [] });
    expect(net).toHaveLength(1);
    expect(net[0].email).toBe("d1@t.test");
  });
});

describe("the safety net still respects every safety rule", () => {
  test("only blood-compatible donors are included", async () => {
    await makeGpslessDonor({ bloodGroup: "O-" }); // compatible for an O- patient
    await makeGpslessDonor({ bloodGroup: "A+" }); // incompatible

    const net = await findCompatibleDonors({ category: "blood", bloodGroup: "O-", excludeIds: [] });
    expect(net.map((d) => d.bloodGroup)).toEqual(["O-"]);
  });

  test("a donor inside the 90-day cooldown is excluded", async () => {
    await makeGpslessDonor({ bloodGroup: "O-", lastDonationDate: daysAgo(DONATION_COOLDOWN_DAYS - 10) });
    const net = await findCompatibleDonors({ category: "blood", bloodGroup: "O-", excludeIds: [] });
    expect(net).toHaveLength(0);
  });

  test("snoozed (unavailable) donors are not emailed", async () => {
    await makeGpslessDonor({ isAvailable: false });
    const net = await findCompatibleDonors({ category: "blood", bloodGroup: "O-", excludeIds: [] });
    expect(net).toHaveLength(0);
  });

  test("already-alerted donors are excluded so they aren't double-pinged", async () => {
    const keep = await makeGpslessDonor();
    const alerted = await makeGpslessDonor();

    const net = await findCompatibleDonors({
      category: "blood", bloodGroup: "O-", excludeIds: [alerted._id],
    });
    expect(net.map((d) => d._id.toString())).toEqual([keep._id.toString()]);
  });
});
