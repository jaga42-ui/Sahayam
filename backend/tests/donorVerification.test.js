/**
 * Donor verification status (services/donorVerification.js) — pure logic.
 */
const { getVerification } = require("../services/donorVerification");

describe("getVerification", () => {
  test("a brand-new user with no confirmed email is unverified", () => {
    expect(getVerification({})).toMatchObject({ verified: false, level: "unverified" });
  });

  test("a confirmed email is the baseline 'verified' tier", () => {
    const v = getVerification({ isEmailVerified: true });
    expect(v.verified).toBe(true);
    expect(v.level).toBe("verified");
    expect(v.email).toBe(true);
  });

  test("an approved KYC document is the stronger 'id_verified' tier", () => {
    const v = getVerification({ isEmailVerified: true, kycStatus: { documentVerified: true } });
    expect(v.verified).toBe(true);
    expect(v.level).toBe("id_verified");
    expect(v.kyc).toBe(true);
  });

  test("KYC approval implies verified even if email flag is unset", () => {
    const v = getVerification({ kycStatus: { documentVerified: true } });
    expect(v.verified).toBe(true);
    expect(v.level).toBe("id_verified");
  });

  test("phone-verified status is reported but is not the trust gate on its own", () => {
    const v = getVerification({ isPhoneVerified: true });
    expect(v.phone).toBe(true);
    expect(v.verified).toBe(false); // email/KYC is the gate, not phone alone
    expect(v.level).toBe("unverified");
  });
});
