/**
 * Engine metrics — the admin "Lifecycle" panel must bucket every SOS into a
 * real state. Legacy blasts predate the `status` state machine and carry no
 * `status` field; this proves they're inferred from what they do have (a
 * response → effectively fulfilled, otherwise long-expired) instead of being
 * dumped into a meaningless "unknown" pile.
 */
const mongoose = require("mongoose");
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const Blast = require("../models/Blast");
const { getEngineMetrics } = require("../controllers/metricsController");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

// Invoke the express-async-handler controller and resolve with whatever it
// sends to res.json (rejecting if it calls next with an error).
function runMetrics() {
  return new Promise((resolve, reject) => {
    getEngineMetrics({}, { json: resolve }, reject);
  });
}

const requester = new mongoose.Types.ObjectId();

test("legacy blasts without a status are bucketed by responses, never 'unknown'", async () => {
  const loc = { type: "Point", coordinates: [77.5946, 12.9716] };

  // Modern blast — created through Mongoose, so it has a real status.
  await Blast.create({ requester, message: "need A+", status: "broadcasting", location: loc });

  // Legacy blasts — raw driver inserts bypass Mongoose defaults, so they have
  // NO `status` field, exactly like the pre-migration production records.
  await Blast.collection.insertMany([
    { requester, message: "legacy answered", responses: [{ donor: new mongoose.Types.ObjectId() }], active: false, location: loc },
    { requester, message: "legacy unanswered", active: false, location: loc },
  ]);

  const result = await runMetrics();

  expect(result.byStatus.unknown).toBeUndefined();
  expect(result.byStatus.broadcasting).toBe(1); // modern
  expect(result.byStatus.fulfilled).toBe(1);    // legacy with a response
  expect(result.byStatus.expired).toBe(1);      // legacy with none
  expect(result.totalBlasts).toBe(3);
  expect(result.answeredCount).toBe(1);          // only the fulfilled one counts as answered
});
