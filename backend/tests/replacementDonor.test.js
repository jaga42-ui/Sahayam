const Blast = require("../models/Blast");

// Build an in-memory Blast doc (no DB connection needed) with N committed donors.
function blastWith(unitsNeeded, committed) {
  return new Blast({
    requester: "000000000000000000000000",
    message: "Need blood",
    unitsNeeded,
    responses: Array.from({ length: committed }, () => ({
      donor: "000000000000000000000001",
    })),
  });
}

describe("replacement-donor coverage", () => {
  test("a 1-unit SOS is covered by the first donor", () => {
    expect(blastWith(1, 0).isCovered()).toBe(false);
    expect(blastWith(1, 1).isCovered()).toBe(true);
  });

  test("a 3-donor request needs all three before it is covered", () => {
    expect(blastWith(3, 2).isCovered()).toBe(false);
    expect(blastWith(3, 3).isCovered()).toBe(true);
    expect(blastWith(3, 4).isCovered()).toBe(true);
  });

  test("unitsNeeded defaults to 1 when unset", () => {
    const b = blastWith(undefined, 1);
    expect(b.unitsNeeded).toBe(1);
    expect(b.isCovered()).toBe(true);
  });
});
