/**
 * Blood compatibility — the single source of truth for the routing engine.
 *
 * The platform previously carried an inline compatibility table in one of the
 * two SOS paths and nothing in the other. Centralising it here means every
 * matching decision (radar display, emergency blast, escalation cron, emergency
 * donation listing) speaks the same medical language.
 *
 * Semantics: `RECIPIENT_CAN_RECEIVE_FROM[patientGroup]` lists the donor blood
 * groups whose red cells are safe for a patient of `patientGroup`. So when
 * someone needs A+ blood we look up `A+` and ping donors who are A+, A-, O+ or
 * O-. O- is the universal donor; AB+ is the universal recipient.
 */

const ALL_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

// patientGroup -> donor groups that can safely give to that patient
const RECIPIENT_CAN_RECEIVE_FROM = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/** Normalise loose user input ("a+", " O-ptive") into a canonical group or null. */
function normalizeGroup(group) {
  if (!group || typeof group !== "string") return null;
  const cleaned = group.toUpperCase().replace(/\s+/g, "");
  return ALL_GROUPS.includes(cleaned) ? cleaned : null;
}

/**
 * Given the patient's required blood group, return the list of donor groups
 * that can safely donate. Unknown / missing input returns an empty array so
 * callers can decide whether to fall back to an unfiltered search.
 */
function getCompatibleDonorGroups(patientGroup) {
  const group = normalizeGroup(patientGroup);
  if (!group) return [];
  return RECIPIENT_CAN_RECEIVE_FROM[group];
}

/** True if a donor of `donorGroup` can give blood to a patient of `patientGroup`. */
function canDonateTo(donorGroup, patientGroup) {
  const compatible = getCompatibleDonorGroups(patientGroup);
  const donor = normalizeGroup(donorGroup);
  return !!donor && compatible.includes(donor);
}

module.exports = {
  ALL_GROUPS,
  RECIPIENT_CAN_RECEIVE_FROM,
  normalizeGroup,
  getCompatibleDonorGroups,
  canDonateTo,
};
