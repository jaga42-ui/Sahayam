/**
 * Phone OTP verification — proves a donor controls the number they registered.
 *
 * The phone is collected and format-validated at signup, but an unverified
 * number can be fake or unreachable — dangerous when a requester is counting on
 * that donor in an emergency. This adds a one-time-code check (sent over SMS)
 * that flips an `isPhoneVerified` flag.
 *
 * Pure helpers here (no DB / no SMS) so the code logic is unit-tested; the
 * controller persists the code/expiry and calls sendSMS. Mirrors the existing
 * 6-digit, time-boxed email verification pattern.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // codes expire after 10 minutes

/** A fresh 6-digit numeric code (as a string, so leading zeros survive). */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Expiry timestamp for a code minted now (injectable clock for tests). */
function otpExpiry(now = Date.now()) {
  return new Date(now + OTP_TTL_MS);
}

/**
 * Validate a submitted code against what we stored.
 *
 * @param {Object} args
 * @param {string} [args.code]       what the user submitted
 * @param {string} [args.expected]   the code we issued and stored
 * @param {Date|number} [args.expiresAt]
 * @param {number} [args.now]
 * @returns {{ valid: boolean, reason: string|null }}
 */
function checkOtp({ code, expected, expiresAt, now = Date.now() } = {}) {
  if (!expected) {
    return { valid: false, reason: "No verification code was requested. Please request a new one." };
  }
  if (expiresAt && now > new Date(expiresAt).getTime()) {
    return { valid: false, reason: "This code has expired. Please request a new one." };
  }
  if (!code || String(code).trim() !== String(expected)) {
    return { valid: false, reason: "Invalid verification code." };
  }
  return { valid: true, reason: null };
}

module.exports = { generateOtp, otpExpiry, checkOtp, OTP_TTL_MS };
