const {
  getCompatibleDonorGroups,
  canDonateTo,
  normalizeGroup,
  ALL_GROUPS,
} = require("../utils/bloodCompat");

describe("blood compatibility matrix", () => {
  test("O- is the universal donor — can give to every patient group", () => {
    ALL_GROUPS.forEach((patient) => {
      expect(canDonateTo("O-", patient)).toBe(true);
    });
  });

  test("AB+ is the universal recipient — can receive from every donor group", () => {
    expect(getCompatibleDonorGroups("AB+").sort()).toEqual([...ALL_GROUPS].sort());
  });

  test("O- patient can only receive from O-", () => {
    expect(getCompatibleDonorGroups("O-")).toEqual(["O-"]);
  });

  test("A+ patient receives from A+, A-, O+, O- only", () => {
    expect(getCompatibleDonorGroups("A+").sort()).toEqual(["A+", "A-", "O+", "O-"]);
    expect(canDonateTo("B+", "A+")).toBe(false);
  });

  test("a positive donor cannot give to a negative recipient", () => {
    expect(canDonateTo("A+", "A-")).toBe(false);
    expect(canDonateTo("A-", "A+")).toBe(true);
  });

  test("normalizeGroup cleans loose input and rejects junk", () => {
    expect(normalizeGroup(" a+ ")).toBe("A+");
    expect(normalizeGroup("o-")).toBe("O-");
    expect(normalizeGroup("XY")).toBeNull();
    expect(normalizeGroup(undefined)).toBeNull();
  });

  test("unknown patient group returns no matches (caller falls back)", () => {
    expect(getCompatibleDonorGroups("ZZ")).toEqual([]);
  });
});

describe("escalation ladder", () => {
  const { LEVELS, MAX_LEVEL, levelConfig, nextEscalationAt } = require("../services/escalationEngine");

  test("radius widens monotonically across levels", () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i].radiusMeters).toBeGreaterThan(LEVELS[i - 1].radiusMeters);
    }
  });

  test("levelConfig clamps to the final level", () => {
    expect(levelConfig(99)).toEqual(LEVELS[MAX_LEVEL - 1]);
  });

  test("nextEscalationAt is the level wait window in the future", () => {
    const from = Date.now();
    const due = nextEscalationAt(1, from);
    expect(due.getTime()).toBe(from + LEVELS[0].waitMs);
  });
});
