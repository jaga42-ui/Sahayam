/**
 * Multicast push that works on every firebase-admin version.
 *
 * IMPORTANT: do NOT use v10's `sendMulticast` — it calls Google's FCM `/batch`
 * endpoint, which Google removed in 2024 (returns 404), so it fails for every
 * message. v11+'s `sendEachForMulticast` sends individual requests (no batch),
 * so use it when present; otherwise loop the single `send()` (live v1 API).
 * All paths return the same shape: { successCount, failureCount, responses }.
 */
const admin = require("firebase-admin");

async function multicastPush(tokens = [], notification) {
  const list = (Array.isArray(tokens) ? tokens : []).filter(Boolean);
  if (list.length === 0) return { successCount: 0, failureCount: 0, responses: [] };

  const messaging = admin.messaging();

  // v11+: individual requests under the hood, safe.
  if (typeof messaging.sendEachForMulticast === "function") {
    return messaging.sendEachForMulticast({ tokens: list, notification });
  }

  // v10 (and as a universal fallback): send to each token individually via the
  // live v1 API. Avoids the dead /batch endpoint that sendMulticast relies on.
  const responses = await Promise.all(
    list.map((token) =>
      messaging
        .send({ token, notification })
        .then((messageId) => ({ success: true, messageId }))
        .catch((error) => ({ success: false, error })),
    ),
  );
  return {
    successCount: responses.filter((r) => r.success).length,
    failureCount: responses.filter((r) => !r.success).length,
    responses,
  };
}

module.exports = { multicastPush };
