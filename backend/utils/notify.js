/**
 * Multi-channel donor notification — push first, email as a guaranteed fallback.
 *
 * Centralises the fan-out that was previously copy-pasted across the blast
 * controller, the emergency-donation controller and the escalation cron.
 * Delivery is best-effort/at-least-once: a donor may receive both a push and an
 * email, which for a life-critical alert is the safe failure mode. Idempotency
 * across escalation rounds is handled upstream by never re-pinging a donor that
 * is already in `blast.pingedDonors`.
 */

const admin = require("firebase-admin");
const { sendPostAlertEmail } = require("./sendEmail");
const { multicastPush } = require("./fcm");

/**
 * @param {Array}  donors            donor docs (need fcmToken / email)
 * @param {Object} payload
 * @param {string} payload.title     push title
 * @param {string} payload.body      push + email body
 * @param {string} [payload.bloodGroup]
 * @param {boolean}[payload.isEmergency=true]
 * @param {Object} [payload.meta]    extra fields forwarded to the email template
 * @returns {Promise<{push:number, email:number}>} count reached per channel
 */
async function notifyDonors(donors = [], payload = {}) {
  const { title, body, bloodGroup, isEmergency = true, meta = {} } = payload;
  const result = { push: 0, email: 0 };
  if (!Array.isArray(donors) || donors.length === 0) return result;

  // --- Channel 1: Firebase push to locked screens -----------------------
  // A donor may have several devices; fan out to all of them (deduped).
  const tokens = [
    ...new Set(
      donors.flatMap((d) =>
        (d.fcmTokens && d.fcmTokens.length ? d.fcmTokens : [d.fcmToken]).filter(Boolean),
      ),
    ),
  ];
  if (tokens.length > 0 && admin.apps.length > 0) {
    try {
      const response = await multicastPush(tokens, { title, body });
      result.push = response.successCount;
    } catch (err) {
      console.error("notifyDonors: push failed", err.message);
    }
  }

  // --- Channel 2: Email fallback (free, no token expiry) ----------------
  const emails = donors.map((d) => d.email).filter(Boolean);
  if (emails.length > 0) {
    try {
      await sendPostAlertEmail(emails, { message: body, bloodGroup, isEmergency, ...meta });
      result.email = emails.length;
    } catch (err) {
      console.error("notifyDonors: email failed", err.message);
    }
  }

  return result;
}

module.exports = { notifyDonors };
