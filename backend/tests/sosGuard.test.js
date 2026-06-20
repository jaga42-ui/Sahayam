/**
 * SOS abuse guard (services/sosGuard.js) — pure decision logic, no DB/clock.
 */
const { canStartSOS, SOS_COOLDOWN_MS } = require("../services/sosGuard");

const NOW = 1_700_000_000_000;
const agoMs = (ms) => new Date(NOW - ms);

describe("canStartSOS", () => {
  test("allows a first-time requester (no prior blasts)", () => {
    expect(canStartSOS({ latestBlast: null, now: NOW })).toEqual({
      allowed: true, code: 200, reason: null,
    });
  });

  test("blocks a user whose broadcasting is admin-disabled (kill-switch)", () => {
    const r = canStartSOS({ blastBlocked: true, latestBlast: null, now: NOW });
    expect(r.allowed).toBe(false);
    expect(r.code).toBe(403);
  });

  test("blocks while an SOS is still in flight (broadcasting/escalating)", () => {
    for (const status of ["broadcasting", "escalating"]) {
      const r = canStartSOS({ latestBlast: { status, createdAt: agoMs(1000) }, now: NOW });
      expect(r.allowed).toBe(false);
      expect(r.code).toBe(409);
    }
  });

  test("blocks a second SOS within the cooldown window", () => {
    const r = canStartSOS({
      latestBlast: { status: "expired", createdAt: agoMs(60 * 1000) }, // 1 min ago
      now: NOW,
    });
    expect(r.allowed).toBe(false);
    expect(r.code).toBe(429);
    expect(r.reason).toMatch(/wait about \d+ minute/);
  });

  test("allows a new SOS once the cooldown has elapsed", () => {
    const r = canStartSOS({
      latestBlast: { status: "expired", createdAt: agoMs(SOS_COOLDOWN_MS + 1000) },
      now: NOW,
    });
    expect(r.allowed).toBe(true);
    expect(r.code).toBe(200);
  });

  test("a resolved (matched/fulfilled) blast does not count as in-flight, only cooldown applies", () => {
    // Past cooldown, terminal status -> allowed.
    const r = canStartSOS({
      latestBlast: { status: "matched", createdAt: agoMs(SOS_COOLDOWN_MS + 1) },
      now: NOW,
    });
    expect(r.allowed).toBe(true);
  });

  test("the kill-switch wins even if cooldown has passed", () => {
    const r = canStartSOS({
      blastBlocked: true,
      latestBlast: { status: "expired", createdAt: agoMs(SOS_COOLDOWN_MS + 99999) },
      now: NOW,
    });
    expect(r.allowed).toBe(false);
    expect(r.code).toBe(403);
  });
});
