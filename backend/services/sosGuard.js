/**
 * SOS abuse guard — decides whether a user may start a new emergency blast.
 *
 * A misfiring or malicious requester can blast every donor in a city and
 * desensitise the whole network, so we gate creation on three rules:
 *   1. admin kill-switch  — a user can be blocked from broadcasting entirely
 *   2. one in-flight SOS  — no new blast while an existing one is still live
 *   3. cooldown window    — a minimum gap between consecutive blasts
 *
 * Pure function: the caller fetches the user's latest blast and passes it in,
 * which keeps this trivially unit-testable and free of DB/clock coupling.
 */

// Minimum gap between a user's consecutive blasts.
const SOS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// A blast in one of these states is still actively recruiting donors.
const ACTIVE_STATES = ["broadcasting", "escalating"];

/**
 * @param {Object}        ctx
 * @param {boolean}      [ctx.blastBlocked]  admin has disabled this user's blasts
 * @param {Object|null}  [ctx.latestBlast]   the user's most recent blast ({ status, createdAt }) or null
 * @param {number}       [ctx.now]           current epoch ms (injectable for tests)
 * @param {number}       [ctx.cooldownMs]    override the default cooldown
 * @returns {{ allowed: boolean, code: number, reason: string|null }}
 */
function canStartSOS({
  blastBlocked = false,
  latestBlast = null,
  now = Date.now(),
  cooldownMs = SOS_COOLDOWN_MS,
} = {}) {
  if (blastBlocked) {
    return {
      allowed: false,
      code: 403,
      reason: "Emergency broadcasting is disabled on your account. Please contact support.",
    };
  }

  if (latestBlast && ACTIVE_STATES.includes(latestBlast.status)) {
    return {
      allowed: false,
      code: 409,
      reason: "You already have an active SOS. Please cancel or resolve it before starting another.",
    };
  }

  if (latestBlast && latestBlast.createdAt) {
    const elapsed = now - new Date(latestBlast.createdAt).getTime();
    if (elapsed >= 0 && elapsed < cooldownMs) {
      const waitMin = Math.max(1, Math.ceil((cooldownMs - elapsed) / 60000));
      return {
        allowed: false,
        code: 429,
        reason: `You sent an SOS recently. Please wait about ${waitMin} minute(s) before sending another.`,
      };
    }
  }

  return { allowed: true, code: 200, reason: null };
}

module.exports = { canStartSOS, SOS_COOLDOWN_MS, ACTIVE_STATES };
