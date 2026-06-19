/**
 * Atomic SOS response (services/blastResponse.js) — the write-side race guard.
 *
 * Proves that concurrent responders can't over-fill a replacement-donor request,
 * a donor can't double-commit, a closed SOS rejects responders, and the blast
 * flips to "matched" (stopping escalation) exactly when it's covered.
 */
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const Blast = require("../models/Blast");
const User = require("../models/User");
const { recordBlastResponse } = require("../services/blastResponse");

const ORIGIN = [77.5946, 12.9716];

let seq = 0;
async function makeDonor() {
  seq += 1;
  return User.create({ name: `d${seq}`, email: `d${seq}@t.test`, password: "x" });
}

async function makeBlast(overrides = {}) {
  const requester = await User.create({
    name: `r${seq++}`, email: `r${seq}@t.test`, password: "x",
  });
  return Blast.create({
    requester: requester._id,
    message: "Need O- now",
    bloodGroup: "O-",
    unitsNeeded: 1,
    location: { type: "Point", coordinates: ORIGIN },
    status: "broadcasting",
    nextEscalationAt: new Date(Date.now() + 60000),
    ...overrides,
  });
}

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("recordBlastResponse", () => {
  test("never accepts more donors than a replacement request needs", async () => {
    const blast = await makeBlast({ unitsNeeded: 3 });
    const donors = await Promise.all(Array.from({ length: 10 }, makeDonor));

    // Ten donors rush a 3-donor request at the same instant.
    const results = await Promise.all(
      donors.map((d) => recordBlastResponse(blast._id, d._id)),
    );

    const accepted = results.filter(Boolean);
    expect(accepted).toHaveLength(3);

    const finalDoc = await Blast.findById(blast._id);
    expect(finalDoc.responses).toHaveLength(3);
    expect(finalDoc.status).toBe("matched");
  });

  test("a donor cannot double-commit (idempotent)", async () => {
    const blast = await makeBlast({ unitsNeeded: 3 });
    const donor = await makeDonor();

    const first = await recordBlastResponse(blast._id, donor._id);
    const second = await recordBlastResponse(blast._id, donor._id);

    expect(first).not.toBeNull();
    expect(second).toBeNull();

    const finalDoc = await Blast.findById(blast._id);
    expect(finalDoc.responses).toHaveLength(1);
  });

  test("the first responder to a 1-unit SOS matches it and stops escalation", async () => {
    const blast = await makeBlast({ unitsNeeded: 1 });
    const donor = await makeDonor();

    const updated = await recordBlastResponse(blast._id, donor._id);

    expect(updated.status).toBe("matched");
    expect(updated.matchedAt).toBeTruthy();
    expect(updated.nextEscalationAt).toBeNull();
  });

  test("firstResponseAt is stamped once and never overwritten", async () => {
    const blast = await makeBlast({ unitsNeeded: 3 });
    const [a, b] = await Promise.all([makeDonor(), makeDonor()]);

    const afterFirst = await recordBlastResponse(blast._id, a._id);
    const stamp = afterFirst.firstResponseAt.getTime();
    const afterSecond = await recordBlastResponse(blast._id, b._id);

    expect(afterSecond.firstResponseAt.getTime()).toBe(stamp);
  });

  test("a closed (expired) SOS rejects new responders", async () => {
    const blast = await makeBlast({ status: "expired" });
    const donor = await makeDonor();

    const result = await recordBlastResponse(blast._id, donor._id);
    expect(result).toBeNull();
  });

  test("an already-matched SOS rejects further responders", async () => {
    const blast = await makeBlast({ unitsNeeded: 1 });
    const [a, b] = [await makeDonor(), await makeDonor()];

    await recordBlastResponse(blast._id, a._id); // matches it
    const late = await recordBlastResponse(blast._id, b._id);

    expect(late).toBeNull();
    const finalDoc = await Blast.findById(blast._id);
    expect(finalDoc.responses).toHaveLength(1);
  });
});
