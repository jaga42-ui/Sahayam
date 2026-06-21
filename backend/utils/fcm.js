/**
 * Version-proof multicast push.
 *
 * firebase-admin renamed its batch send: v11+ has sendEachForMulticast, v10 has
 * sendMulticast. Calling the wrong one throws "not a function" — which silently
 * killed every SOS push under v10. This picks whichever the installed SDK
 * actually has, and falls back to per-token send() if neither exists. All paths
 * return the same BatchResponse shape: { successCount, failureCount, responses }.
 */
const admin = require("firebase-admin");

async function multicastPush(tokens = [], notification) {
  const list = (Array.isArray(tokens) ? tokens : []).filter(Boolean);
  if (list.length === 0) return { successCount: 0, failureCount: 0, responses: [] };

  const messaging = admin.messaging();

  if (typeof messaging.sendEachForMulticast === "function") {
    return messaging.sendEachForMulticast({ tokens: list, notification });
  }
  if (typeof messaging.sendMulticast === "function") {
    return messaging.sendMulticast({ tokens: list, notification });
  }

  // Fallback: send to each token individually.
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
