/**
 * Direct chat (radar "message a donor") — donation-less messages.
 * Verifies the schema now allows donationId: null and that direct vs
 * donation conversations between the same two people stay separate.
 */
const { connect, clearDatabase, closeDatabase } = require("./helpers/memoryDb");
const mongoose = require("mongoose");
const Message = require("../models/Message");

const A = new mongoose.Types.ObjectId();
const B = new mongoose.Types.ObjectId();
const DONATION = new mongoose.Types.ObjectId();

const pair = { $or: [{ sender: A, receiver: B }, { sender: B, receiver: A }] };

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("direct chat data model", () => {
  test("a message can be created with no donation (was previously required)", async () => {
    const m = await Message.create({ sender: A, receiver: B, content: "hi" });
    expect(m.donationId).toBeNull();
  });

  test("direct and donation chats between the same pair stay separate", async () => {
    await Message.create({ sender: A, receiver: B, content: "direct hello", donationId: null });
    await Message.create({ sender: B, receiver: A, content: "about the donation", donationId: DONATION });

    const direct = await Message.find({ donationId: null, ...pair }).sort({ createdAt: 1 });
    const onDonation = await Message.find({ donationId: DONATION, ...pair }).sort({ createdAt: 1 });

    expect(direct.map((m) => m.content)).toEqual(["direct hello"]);
    expect(onDonation.map((m) => m.content)).toEqual(["about the donation"]);
  });
});
