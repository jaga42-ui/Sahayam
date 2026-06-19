/**
 * Atomic SOS response — the write-side correctness guarantee for blasts.
 *
 * Recording a donor's "I'm on the way" must be race-safe: concurrent responders
 * to a replacement-donor request (unitsNeeded > 1) must not over-fill it, and a
 * donor double-tapping must not double-commit. This is the Blast-side analogue
 * of the atomic claim used for emergency Donations.
 *
 * A single conditional findOneAndUpdate enforces, in the query:
 *   - the blast is still accepting (broadcasting | escalating)
 *   - this donor hasn't already responded
 *   - there's still an open slot (responses < unitsNeeded)
 * and the aggregation-pipeline update appends the responder, stamps the first
 * response time once, and flips the blast to "matched" the moment it's fully
 * covered (stopping escalation).
 */
const Blast = require("../models/Blast");

/**
 * @param {string|import('mongoose').Types.ObjectId} blastId
 * @param {import('mongoose').Types.ObjectId} donorId
 * @returns {Promise<Object|null>} the updated blast, or null when no slot was
 *   claimed (closed, already responded, or just filled up by someone else).
 */
function recordBlastResponse(blastId, donorId) {
  return Blast.findOneAndUpdate(
    {
      _id: blastId,
      status: { $in: ["broadcasting", "escalating"] },
      "responses.donor": { $ne: donorId },
      $expr: { $lt: [{ $size: "$responses" }, { $ifNull: ["$unitsNeeded", 1] }] },
    },
    [
      {
        $set: {
          responses: {
            $concatArrays: [
              "$responses",
              [{ donor: donorId, status: "on-the-way", respondedAt: "$$NOW" }],
            ],
          },
          firstResponseAt: { $ifNull: ["$firstResponseAt", "$$NOW"] },
        },
      },
      {
        $set: {
          _covered: { $gte: [{ $size: "$responses" }, { $ifNull: ["$unitsNeeded", 1] }] },
        },
      },
      {
        $set: {
          status: { $cond: ["$_covered", "matched", "$status"] },
          matchedAt: { $cond: ["$_covered", { $ifNull: ["$matchedAt", "$$NOW"] }, "$matchedAt"] },
          nextEscalationAt: { $cond: ["$_covered", null, "$nextEscalationAt"] },
        },
      },
      { $unset: "_covered" },
    ],
    { new: true },
  );
}

module.exports = { recordBlastResponse };
