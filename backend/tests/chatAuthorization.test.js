/**
 * Chat authorization — only a donation's participants may post into its chat.
 * Closes the "any logged-in user can DM anyone by guessing ids" gap.
 */
const { isChatParticipant, isBlockedBetween } = require("../controllers/chatController");

const donor = "aaaaaaaaaaaaaaaaaaaaaaaa";
const receiver = "bbbbbbbbbbbbbbbbbbbbbbbb";
const requester = "cccccccccccccccccccccccc";
const stranger = "dddddddddddddddddddddddd";

const donation = {
  donorId: donor,
  receiverId: receiver,
  requestedBy: [requester],
};

describe("isChatParticipant", () => {
  test("the donor can post", () => {
    expect(isChatParticipant(donation, donor)).toBe(true);
  });

  test("the approved receiver can post", () => {
    expect(isChatParticipant(donation, receiver)).toBe(true);
  });

  test("someone who requested the item can post", () => {
    expect(isChatParticipant(donation, requester)).toBe(true);
  });

  test("a stranger cannot post (the harassment case)", () => {
    expect(isChatParticipant(donation, stranger)).toBe(false);
  });

  test("missing donation or user is rejected", () => {
    expect(isChatParticipant(null, donor)).toBe(false);
    expect(isChatParticipant(donation, null)).toBe(false);
  });

  test("works before a receiver is approved (receiverId still null)", () => {
    const open = { donorId: donor, receiverId: null, requestedBy: [requester] };
    expect(isChatParticipant(open, requester)).toBe(true);
    expect(isChatParticipant(open, stranger)).toBe(false);
  });
});

describe("isBlockedBetween", () => {
  const A = { _id: donor, blockedUsers: [] };
  const B = { _id: receiver, blockedUsers: [] };

  test("blocked in either direction stops messaging", () => {
    expect(isBlockedBetween({ ...A, blockedUsers: [receiver] }, B)).toBe(true); // A blocked B
    expect(isBlockedBetween(A, { ...B, blockedUsers: [donor] })).toBe(true);    // B blocked A
  });

  test("no block → messaging allowed", () => {
    expect(isBlockedBetween(A, B)).toBe(false);
  });

  test("missing user is safe (no crash, not blocked)", () => {
    expect(isBlockedBetween(null, B)).toBe(false);
    expect(isBlockedBetween(A, null)).toBe(false);
  });
});
