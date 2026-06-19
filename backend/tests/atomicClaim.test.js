/**
 * Atomic claim — the correctness guarantee behind "exactly one hero wins".
 *
 * When several donors accept the same emergency at the same instant, only one
 * may win; the rest must get a clean rejection (the controller turns a null
 * result into HTTP 409). This mirrors the conditional findOneAndUpdate in
 * controllers/donationController.js -> acceptSOS. If that filter/update ever
 * drifts, keep this test in sync.
 */
const mongoose = require("mongoose");
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const Donation = require("../models/Donation");
const User = require("../models/User");

// The exact conditional claim used by acceptSOS. Returns the claimed doc, or
// null when another hero already took it.
function claim(donationId, heroId) {
  return Donation.findOneAndUpdate(
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
}

async function makeUser(name) {
  return User.create({ name, email: `${name}@t.test`, password: "x" });
}

async function makeEmergency(donorId) {
  return Donation.create({
    donorId,
    type: "request",
    category: "blood",
    title: "O- needed urgently",
    description: "ICU patient",
    pickupPIN: "1234",
    isEmergency: true,
    status: "active",
  });
}

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("atomic SOS claim", () => {
  test("only one of many simultaneous accepts wins; the rest get nothing", async () => {
    const poster = await makeUser("poster");
    const heroes = await Promise.all(
      Array.from({ length: 8 }, (_, i) => makeUser(`hero${i}`)),
    );
    const sos = await makeEmergency(poster._id);

    // Fire all eight accepts concurrently against the same emergency.
    const results = await Promise.all(heroes.map((h) => claim(sos._id, h._id)));

    const winners = results.filter(Boolean);
    const losers = results.filter((r) => r === null);

    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(7);

    // The doc ends up claimed by exactly the one winner.
    const finalDoc = await Donation.findById(sos._id);
    expect(finalDoc.status).toBe("pending");
    expect(finalDoc.receiverId.toString()).toBe(winners[0].receiverId.toString());
  });

  test("a second accept after the first is rejected (clean 409 path)", async () => {
    const poster = await makeUser("poster");
    const first = await makeUser("first");
    const second = await makeUser("second");
    const sos = await makeEmergency(poster._id);

    const won = await claim(sos._id, first._id);
    const lost = await claim(sos._id, second._id);

    expect(won).not.toBeNull();
    expect(lost).toBeNull();

    const finalDoc = await Donation.findById(sos._id);
    expect(finalDoc.receiverId.toString()).toBe(first._id.toString());
  });

  test("an already-fulfilled emergency cannot be claimed", async () => {
    const poster = await makeUser("poster");
    const hero = await makeUser("late");
    const sos = await makeEmergency(poster._id);
    sos.status = "fulfilled";
    await sos.save();

    const result = await claim(sos._id, hero._id);
    expect(result).toBeNull();
  });

  test("a non-existent emergency claim returns null, never throws", async () => {
    const hero = await makeUser("hero");
    const result = await claim(new mongoose.Types.ObjectId(), hero._id);
    expect(result).toBeNull();
  });
});
