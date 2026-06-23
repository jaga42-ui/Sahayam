/**
 * Chat authorization — only a donation's participants may post into its chat.
 * Closes the "any logged-in user can DM anyone by guessing ids" gap.
 */
const { isChatParticipant } = require("../controllers/chatController");

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
