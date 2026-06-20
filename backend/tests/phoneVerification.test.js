/**
 * Phone OTP helpers (services/phoneVerification.js) — pure logic, no DB/SMS.
 */
const { generateOtp, otpExpiry, checkOtp, OTP_TTL_MS } = require("../services/phoneVerification");

const NOW = 1_700_000_000_000;

describe("generateOtp", () => {
  test("is always a 6-digit numeric string (leading zeros preserved)", () => {
    for (let i = 0; i < 500; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });
});

describe("otpExpiry", () => {
  test("is exactly the TTL ahead of now", () => {
    expect(otpExpiry(NOW).getTime()).toBe(NOW + OTP_TTL_MS);
  });
});

describe("checkOtp", () => {
  const expiresAt = NOW + OTP_TTL_MS;

  test("accepts the correct code before expiry", () => {
    expect(checkOtp({ code: "123456", expected: "123456", expiresAt, now: NOW }))
      .toEqual({ valid: true, reason: null });
  });

  test("trims whitespace around the submitted code", () => {
    expect(checkOtp({ code: " 123456 ", expected: "123456", expiresAt, now: NOW }).valid).toBe(true);
  });

  test("rejects a wrong code", () => {
    const r = checkOtp({ code: "000000", expected: "123456", expiresAt, now: NOW });
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/invalid/i);
  });

  test("rejects an expired code even if it matches", () => {
    const r = checkOtp({ code: "123456", expected: "123456", expiresAt: NOW - 1, now: NOW });
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/expired/i);
  });

  test("rejects when no code was ever issued", () => {
    const r = checkOtp({ code: "123456", expected: undefined, now: NOW });
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/no verification code/i);
  });

  test("rejects an empty submission", () => {
    expect(checkOtp({ code: "", expected: "123456", expiresAt, now: NOW }).valid).toBe(false);
  });
});
