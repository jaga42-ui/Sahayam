/**
 * Account deletion — the user's right to erasure.
 *
 * A real-user platform that stores location, phone, email and health-adjacent
 * data (blood group, KYC) must let a person delete themselves and their data,
 * not just rely on an admin. This removes everything the user authored and
 * scrubs references to them from content other people own, then deletes the
 * user record itself.
 *
 * Returns a summary of what was removed (useful for audit logs / the response).
 */
const User = require("../models/User");
const Blast = require("../models/Blast");
const Donation = require("../models/Donation");
const Message = require("../models/Message");
const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const BloodCamp = require("../models/BloodCamp");

async function deleteUserAccount(userId) {
  const id = userId;
  const summary = {};

  // 1. Delete content the user owns / authored.
  summary.donations = (await Donation.deleteMany({ donorId: id })).deletedCount;
  summary.blasts = (await Blast.deleteMany({ requester: id })).deletedCount;
  summary.messages = (
    await Message.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
  ).deletedCount;
  summary.feedback = (await Feedback.deleteMany({ user: id })).deletedCount;
  summary.events = (await Event.deleteMany({ organizationId: id })).deletedCount;
  summary.camps = (await BloodCamp.deleteMany({ organizer: id })).deletedCount;

  // 2. Scrub references to the user from content other people own.
  await Donation.updateMany(
    { $or: [{ requestedBy: id }, { reports: id }] },
    { $pull: { requestedBy: id, reports: id } },
  );
  await Donation.updateMany({ receiverId: id }, { $set: { receiverId: null } });
  await Donation.updateMany(
    { verifiedByInstitution: id },
    { $set: { verifiedByInstitution: null } },
  );
  await Blast.updateMany(
    { $or: [{ pingedDonors: id }, { "responses.donor": id }] },
    { $pull: { pingedDonors: id, responses: { donor: id } } },
  );
  await BloodCamp.updateMany({ registrations: id }, { $pull: { registrations: id } });

  // 3. Finally, remove the user record itself.
  summary.user = (await User.deleteOne({ _id: id })).deletedCount;

  return summary;
}

module.exports = { deleteUserAccount };
