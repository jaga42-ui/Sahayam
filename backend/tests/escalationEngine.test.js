/**
 * Escalation engine — the timeout-driven state machine that widens an SOS until
 * it's covered. These tests assert the guarantees that matter when a real person
 * is waiting for blood:
 *   - a due, unanswered blast widens to the next level and pings a FRESH ring
 *   - donors already pinged are NEVER pinged again (the idempotency guarantee)
 *   - a blast that has run out of levels EXPIRES rather than looping forever
 *   - blasts that aren't due, or are already covered, are left alone
 *
 * Real Blast/User docs + real $geoNear matching; only the outbound notification
 * fan-out is mocked so nothing is actually sent.
 */
jest.mock("../utils/notify", () => ({
  notifyDonors: jest.fn().mockResolvedValue({ push: 0, email: 0 }),
}));

const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const Blast = require("../models/Blast");
const User = require("../models/User");
const { notifyDonors } = require("../utils/notify");
const { runEscalationCycle, MAX_LEVEL } = require("../services/escalationEngine");

const ORIGIN = [77.5946, 12.9716]; // [lng, lat]
const past = () => new Date(Date.now() - 60 * 1000);

let seq = 0;
async function makeDonor(lngOffset = 0.02, latOffset = 0.02) {
  seq += 1;
  return User.create({
    name: `d${seq}`,
    email: `d${seq}@t.test`,
    password: "x",
    activeRole: "donor",
    isAvailable: true,
    bloodGroup: "O-",
    location: { type: "Point", coordinates: [ORIGIN[0] + lngOffset, ORIGIN[1] + latOffset] },
  });
}

async function makeBlast(overrides = {}) {
  const requester = await User.create({
    name: `req${seq++}`, email: `req${seq}@t.test`, password: "x",
  });
  return Blast.create({
    requester: requester._id,
    message: "Need O- now",
    category: "blood",
    bloodGroup: "O-",
    unitsNeeded: 1,
    location: { type: "Point", coordinates: ORIGIN },
    status: "broadcasting",
    escalationLevel: 1,
    nextEscalationAt: past(),
    ...overrides,
  });
}

beforeAll(connect);
afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
afterAll(closeDatabase);

describe("runEscalationCycle", () => {
  test("widens a due, unanswered blast and pings the donors found", async () => {
    const donor = await makeDonor(); // ~3 km, inside the level-2 (15 km) ring
    const blast = await makeBlast();

    const stats = await runEscalationCycle();

    expect(stats).toEqual({ escalated: 1, expired: 0 });

    const updated = await Blast.findById(blast._id);
    expect(updated.status).toBe("escalating");
    expect(updated.escalationLevel).toBe(2);
    expect(updated.radiusMeters).toBe(15000);
    expect(updated.nextEscalationAt.getTime()).toBeGreaterThan(Date.now());
    expect(updated.pingedDonors.map(String)).toContain(donor._id.toString());

    expect(notifyDonors).toHaveBeenCalledTimes(1);
    const pinged = notifyDonors.mock.calls[0][0];
    expect(pinged.map((d) => d._id.toString())).toContain(donor._id.toString());
  });

  test("never re-pings a donor already in pingedDonors", async () => {
    const alreadyPinged = await makeDonor(0.01, 0.01); // ~1.5 km
    const fresh = await makeDonor(0.03, 0.03);         // ~4.7 km
    const blast = await makeBlast({ pingedDonors: [alreadyPinged._id] });

    await runEscalationCycle();

    expect(notifyDonors).toHaveBeenCalledTimes(1);
    const pingedIds = notifyDonors.mock.calls[0][0].map((d) => d._id.toString());
    expect(pingedIds).toContain(fresh._id.toString());
    expect(pingedIds).not.toContain(alreadyPinged._id.toString());
  });

  test("expires a blast that has exhausted every level", async () => {
    const blast = await makeBlast({ status: "escalating", escalationLevel: MAX_LEVEL });

    const stats = await runEscalationCycle();

    expect(stats).toEqual({ escalated: 0, expired: 1 });
    const updated = await Blast.findById(blast._id);
    expect(updated.status).toBe("expired");
    expect(updated.active).toBe(false);
    expect(notifyDonors).not.toHaveBeenCalled();
  });

  test("leaves a blast whose wait window has not elapsed", async () => {
    const blast = await makeBlast({ nextEscalationAt: new Date(Date.now() + 60 * 1000) });

    const stats = await runEscalationCycle();

    expect(stats).toEqual({ escalated: 0, expired: 0 });
    const updated = await Blast.findById(blast._id);
    expect(updated.escalationLevel).toBe(1);
    expect(notifyDonors).not.toHaveBeenCalled();
  });

  test("leaves an already-covered blast alone (enough donors committed)", async () => {
    const d1 = await makeDonor();
    const d2 = await makeDonor();
    // unitsNeeded 2, two responses already in -> covered, must not keep recruiting.
    await makeBlast({
      status: "escalating",
      unitsNeeded: 2,
      responses: [{ donor: d1._id }, { donor: d2._id }],
    });

    const stats = await runEscalationCycle();

    expect(stats).toEqual({ escalated: 0, expired: 0 });
    expect(notifyDonors).not.toHaveBeenCalled();
  });
});
