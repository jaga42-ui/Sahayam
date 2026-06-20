/**
 * Account deletion (services/accountDeletion.js) — right to erasure.
 *
 * Verifies that deleting a user removes everything they authored AND scrubs
 * references to them from content other people own (no dangling pointers, no
 * leftover PII), while leaving other users' data intact.
 */
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const User = require("../models/User");
const Blast = require("../models/Blast");
const Donation = require("../models/Donation");
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");
const BloodCamp = require("../models/BloodCamp");
const { deleteUserAccount } = require("../services/accountDeletion");

let seq = 0;
const makeUser = () => {
  seq += 1;
  return User.create({ name: `u${seq}`, email: `u${seq}@t.test`, password: "x" });
};

const makeDonation = (donorId, extra = {}) =>
  Donation.create({
    donorId, type: "request", category: "blood", title: "t", description: "d",
    pickupPIN: "1234", ...extra,
  });

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("deleteUserAccount", () => {
  test("removes everything the user authored", async () => {
    const me = await makeUser();
    const other = await makeUser();

    await makeDonation(me._id);
    await Blast.create({
      requester: me._id, message: "need O-",
      location: { type: "Point", coordinates: [77.59, 12.97] },
    });
    await Message.create({ sender: me._id, receiver: other._id, donationId: me._id, content: "hi" });
    await Message.create({ sender: other._id, receiver: me._id, donationId: me._id, content: "yo" });
    await Feedback.create({ user: me._id, rating: 5, message: "great" });

    const summary = await deleteUserAccount(me._id);

    expect(summary.user).toBe(1);
    expect(summary.donations).toBe(1);
    expect(summary.blasts).toBe(1);
    expect(summary.messages).toBe(2);
    expect(summary.feedback).toBe(1);

    expect(await User.findById(me._id)).toBeNull();
    expect(await Donation.countDocuments({ donorId: me._id })).toBe(0);
    expect(await Blast.countDocuments({ requester: me._id })).toBe(0);
    expect(await Message.countDocuments({ $or: [{ sender: me._id }, { receiver: me._id }] })).toBe(0);
  });

  test("scrubs references to the user from other people's content", async () => {
    const me = await makeUser();
    const other = await makeUser();

    // A donation OWNED BY other that references me in several ways.
    const theirDonation = await makeDonation(other._id, {
      requestedBy: [me._id, other._id],
      reports: [me._id],
      receiverId: me._id,
    });
    // A blast OWNED BY other that pinged me and recorded my response.
    const theirBlast = await Blast.create({
      requester: other._id,
      message: "need A+",
      location: { type: "Point", coordinates: [77.59, 12.97] },
      pingedDonors: [me._id, other._id],
      responses: [{ donor: me._id }, { donor: other._id }],
    });
    // A camp OWNED BY other where I'm registered.
    const theirCamp = await BloodCamp.create({
      organizer: other._id, title: "Camp", venue: "Hall", date: new Date(),
      registrations: [me._id, other._id],
    });

    await deleteUserAccount(me._id);

    const d = await Donation.findById(theirDonation._id);
    expect(d).not.toBeNull(); // other's content survives
    expect(d.requestedBy.map(String)).toEqual([other._id.toString()]);
    expect(d.reports).toHaveLength(0);
    expect(d.receiverId).toBeNull();

    const b = await Blast.findById(theirBlast._id);
    expect(b.pingedDonors.map(String)).toEqual([other._id.toString()]);
    expect(b.responses).toHaveLength(1);
    expect(b.responses[0].donor.toString()).toBe(other._id.toString());

    const c = await BloodCamp.findById(theirCamp._id);
    expect(c.registrations.map(String)).toEqual([other._id.toString()]);
  });

  test("does not touch unrelated users' owned data", async () => {
    const me = await makeUser();
    const other = await makeUser();
    const keep = await makeDonation(other._id);

    await deleteUserAccount(me._id);

    expect(await Donation.findById(keep._id)).not.toBeNull();
    expect(await User.findById(other._id)).not.toBeNull();
  });
});
