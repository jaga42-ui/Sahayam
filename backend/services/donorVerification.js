/**
 * Donor verification status — derived from the trust signals we already collect
 * for free, so "verified donor" needs no SMS cost or DLT registration.
 *
 * Tiers:
 *   - "unverified"  — email not confirmed
 *   - "verified"    — email confirmed (the baseline gate)
 *   - "id_verified" — a KYC identity document was approved by an admin (stronger)
 *
 * `verified` is the simple boolean a requester cares about: can we trust this is
 * a real, reachable person. Email confirmation is the minimum bar.
 */
function getVerification(user = {}) {
  const email = !!user.isEmailVerified;
  const phone = !!user.isPhoneVerified;
  const kyc = !!(user.kycStatus && user.kycStatus.documentVerified);

  let level = "unverified";
  if (kyc) level = "id_verified";
  else if (email) level = "verified";

  return {
    verified: email || kyc,
    level,
    email,
    phone,
    kyc,
  };
}

module.exports = { getVerification };
