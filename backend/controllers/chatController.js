const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin Initialized successfully in Chat");
    } else {
      console.log(
        "⚠️ FIREBASE_SERVICE_ACCOUNT env var missing. Chat push notifications disabled.",
      );
    }
  } catch (error) {
    console.log("⚠️ Firebase Admin setup failed in Chat:", error.message);
  }
}

/**
 * Only a donation's participants may post into its chat: the donor, the approved
 * receiver, or anyone who requested it. Pure + exported so it's unit-tested.
 */
function isChatParticipant(donation, userId) {
  if (!donation || !userId) return false;
  const me = userId.toString();
  const participants = [
    donation.donorId?.toString(),
    donation.receiverId?.toString(),
    ...(donation.requestedBy || []).map((id) => id.toString()),
  ].filter(Boolean);
  return participants.includes(me);
}

// @desc    Get user's inbox
// @route   GET /api/chat/inbox
const getInbox = asyncHandler(async (req, res) => {
  const myId = req.user._id;

  // 👉 THE FIX: MongoDB Aggregation. This fetches only the exact latest message per conversation
  // instead of pulling 10,000+ messages into Node.js RAM.
  const inboxData = await Message.aggregate([
    { 
      $match: { 
        $or: [
          { sender: new mongoose.Types.ObjectId(myId) }, 
          { receiver: new mongoose.Types.ObjectId(myId) }
        ] 
      } 
    },
    { $sort: { createdAt: -1 } }, // Ensure latest message is first before grouping
    {
      $group: {
        _id: {
          donationId: "$donationId",
          otherUser: { 
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(myId)] }, 
              "$receiver", 
              "$sender"
            ] 
          }
        },
        latestMessage: { $first: "$content" },
        updatedAt: { $first: "$createdAt" },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ["$read", false] }, 
                { $ne: ["$sender", new mongoose.Types.ObjectId(myId)] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    // Join with Donation details
    { 
      $lookup: { 
        from: "donations", 
        localField: "_id.donationId", 
        foreignField: "_id", 
        as: "donation" 
      } 
    },
    // preserveNullAndEmptyArrays so direct chats (donationId: null) aren't dropped.
    { $unwind: { path: "$donation", preserveNullAndEmptyArrays: true } },
    // Join with User details
    { 
      $lookup: { 
        from: "users", 
        localField: "_id.otherUser", 
        foreignField: "_id", 
        as: "otherUserDetails" 
      } 
    },
    { $unwind: "$otherUserDetails" },
    { $sort: { updatedAt: -1 } } // Final sort to put latest conversations at the top
  ]);

  // Format the output exactly as the React frontend expects it
  const formattedConversations = inboxData.map((convo) => {
    const otherId = convo.otherUserDetails._id.toString();
    const isDirect = !convo.donation;
    return {
      chatRoomId: isDirect
        ? `direct_${otherId}`
        : `${convo.donation._id.toString()}_${otherId}`,
      donationId: convo.donation?._id || null,
      donationTitle: isDirect ? "Direct message" : convo.donation.title,
      otherUserId: convo.otherUserDetails._id,
      otherUserName: convo.otherUserDetails.name,
      otherUserProfilePic: convo.otherUserDetails.profilePic,
      latestMessage: convo.latestMessage?.startsWith("[AUDIO]")
        ? "🎤 Voice message"
        : convo.latestMessage ?? "",
      updatedAt: convo.updatedAt,
      unreadCount: convo.unreadCount,
    };
  });

  res.json(formattedConversations);
});

// @desc    Get chat history
// @route   GET /api/chat/:donationId
const getChatHistory = asyncHandler(async (req, res) => {
  const rawId = req.params.donationId;
  const parts = rawId.split("_");
  const myId = req.user._id;
  const isDirect = parts[0] === "direct";
  const chatReceiverId = parts[1];

  // Direct chats carry donationId: null; donation chats carry a real ObjectId.
  if (!isDirect && !mongoose.isValidObjectId(parts[0])) {
    return res.json([]);
  }

  const query = { donationId: isDirect ? null : parts[0] };

  const otherUserId =
    chatReceiverId && myId.toString() !== chatReceiverId ? chatReceiverId : null;
  query.$or = otherUserId
    ? [
        { sender: myId, receiver: otherUserId },
        { sender: otherUserId, receiver: myId },
      ]
    : [{ sender: myId }, { receiver: myId }];

  const messages = await Message.find(query).sort({ createdAt: 1 });

  res.json(messages);
});

// @desc    Save a new message
// @route   POST /api/chat
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, donationId, content } = req.body;

  if (!receiverId || !donationId || !content) {
    res.status(400);
    throw new Error("Missing required fields");
  }
  if (typeof content !== "string" || !content.trim() || content.length > 2000) {
    res.status(400);
    throw new Error("Message must be between 1 and 2000 characters.");
  }
  if (receiverId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't message yourself.");
  }

  // A "direct_<userId>" room is the radar "message a donor" feature — there's no
  // donation behind it. It's allowed for any user (that IS the feature) and
  // gated by the chat rate limiter; donation chats below are participant-checked.
  const isDirect = String(donationId).startsWith("direct");
  let storedDonationId = null;

  if (!isDirect) {
    const actualDonationId = donationId.includes("_")
      ? donationId.split("_")[0]
      : donationId;

    // Clean error instead of a CastError/500 on a malformed id.
    if (!mongoose.isValidObjectId(actualDonationId)) {
      res.status(400);
      throw new Error("Invalid conversation reference.");
    }

    // 👉 AUTHORIZATION: the donation must exist AND the sender must be a
    // participant (donor, approved receiver, or a requester). Without this, any
    // logged-in user could spam/harass anyone by guessing ids.
    const Donation = require("../models/Donation");
    const donation = await Donation.findById(actualDonationId).select(
      "donorId receiverId requestedBy",
    );
    if (!donation) {
      res.status(404);
      throw new Error("This conversation is no longer available.");
    }
    if (!isChatParticipant(donation, req.user._id)) {
      res.status(403);
      throw new Error("You're not part of this conversation.");
    }
    storedDonationId = actualDonationId;
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    donationId: storedDonationId,
    content: content.trim(),
  });

  const io = req.app.get("io");
  if (io) {
    io.to(receiverId.toString()).emit("new_message_notification");
  }

  try {
    const receiver = await User.findById(receiverId);

    console.log(`[PUSH TEST] Checking receiver: ${receiver?.name}. Token exists? ${!!receiver?.fcmToken}`);

    if (receiver && receiver.fcmToken) {
      const pushMessage = {
        notification: {
          title: `${req.user.name} sent you a message`,
          body: content.startsWith("[AUDIO]")
            ? "🎤 Voice message"
            : content.length > 40
              ? content.substring(0, 40) + "..."
              : content,
        },
        token: receiver.fcmToken,
      };

      await admin.messaging().send(pushMessage);
      console.log(
        `🔥 Firebase Chat Blast: Sent to ${receiver.name}'s locked phone.`,
      );
    } else {
      console.log(`⚠️ Push skipped: User ${receiver?.name} does NOT have a phone token saved in MongoDB.`);
    }
  } catch (error) {
    console.error("Firebase Chat Push Error:", error.message);
  }

  res.status(201).json(message);
});

// @route   DELETE /api/chat/:id
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }
  if (message.sender.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to delete this message");
  }

  await message.deleteOne();
  res.json({ id: req.params.id, donationId: message.donationId });
});

// @route   PUT /api/chat/:id
const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }
  if (message.sender.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to edit this message");
  }

  message.content = req.body.content;
  const updatedMessage = await message.save();

  res.json(updatedMessage);
});

// @desc    Mark all messages in a chat as read
// @route   PUT /api/chat/:donationId/read
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const rawId = req.params.donationId;
  const parts = rawId.split("_");
  const isDirect = parts[0] === "direct";
  const chatReceiverId = parts[1];

  if (!isDirect && !mongoose.isValidObjectId(parts[0])) {
    return res.json({ success: true });
  }

  let query = {
    donationId: isDirect ? null : parts[0],
    receiver: req.user._id,
    read: false,
  };

  if (chatReceiverId && req.user._id.toString() !== chatReceiverId) {
    query.sender = chatReceiverId;
  }

  await Message.updateMany(query, { $set: { read: true } });

  res.json({ success: true });
});

module.exports = {
  getInbox,
  getChatHistory,
  sendMessage,
  deleteMessage,
  editMessage,
  markMessagesAsRead,
  isChatParticipant,
};