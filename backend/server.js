const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const webpush = require("web-push");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const logger = require("./utils/logger");

const cron = require("node-cron");
const Donation = require("./models/Donation");
const Feedback = require("./models/Feedback");
const User = require("./models/User");
const CronLock = require("./models/CronLock");
const { protect } = require("./middleware/authMiddleware");
const { runEscalationCycle } = require("./services/escalationEngine");

dotenv.config();

// 👉 STARTUP CHECK: Ensure critical env variables are present
const requiredEnv = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    logger.error(`🚨 FATAL ERROR: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);

// Bulletproof Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

if (
  process.env.VAPID_EMAIL &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "https://sahayam-beta.vercel.app",
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const io = new Server(server, { cors: corsOptions });
app.set("io", io);

const jwt = require("jsonwebtoken");
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id.toString();
    next();
  } catch {
    next(new Error("Invalid socket token"));
  }
});

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👉 THE FIX: Trust proxy so express-rate-limit reads the real IP behind Render's load balancer
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    message: "Too many requests. Please wait a few minutes to cool down.",
  },
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    message: "Spam protection active. You have reached your hourly post limit.",
  },
});

// 👉 THE FIX: Strict Auth Limiter to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Security Protocol Active: Too many authentication attempts. Try again in 15 minutes.",
  },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgotpassword", authLimiter);

app.use("/api/donations", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

app.use("/api/events", (req, res, next) => {
  if (req.method === "POST") return postLimiter(req, res, next);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Standard Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/camps", require("./routes/campRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/events", require("./routes/events"));

// Swagger API Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ==========================================
// 👉 FEEDBACK ROUTES (Inline MVP implementation)
// ==========================================

// 1. Users submitting feedback
app.post("/api/feedback", protect, async (req, res) => {
  try {
    const { calculateRank, getPointsForAction } = require("./utils/gamification");

    const feedback = await Feedback.create({
      user: req.user._id,
      rating: req.body.rating,
      message: req.body.message
    });

    const user = await User.findById(req.user._id);
    user.points += getPointsForAction('SUBMIT_APP_FEEDBACK');
    user.rank = calculateRank(user.points);
    await user.save();

    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ message: "Failed to submit feedback" });
  }
});

// 2. Admins retrieving feedback for the Command Center
app.get("/api/admin/feedback", protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized as an admin" });
    }
    const feedbacks = await Feedback.find({})
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });
    
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
});
// ==========================================

io.on("connection", (socket) => {
  socket.on("setup", (userId) => {
    if (socket.userId && socket.userId !== userId.toString()) return;
    socket.join(userId);
  });

  socket.on("join_chat", ({ userId, donationId }) => {
    // Rooms are no longer needed for 1-to-1 secure chat, but keeping for legacy compatibility if needed
    socket.join(donationId);
  });

  socket.on("send_message", (data) => {
    // 👉 THE FIX: Emit securely to the receiver's private channel. Prevents eavesdropping and fixes asymmetric room bug.
    socket.to(data.receiver).emit("receive_message", data);
    socket.to(data.receiver).emit("new_message_notification", data);
  });

  socket.on("mark_as_read", ({ receiverId, readerId }) => {
    socket.to(receiverId).emit("messages_read", { readerId });
  });

  socket.on("edit_message", (data) => {
    socket.to(data.receiver).emit("message_edited", data);
  });

  socket.on("delete_message", (data) => {
    socket.to(data.receiver).emit("message_deleted", data.id);
  });
});

cron.schedule("0 0 * * *", async () => {
  try {
    // Attempt to acquire lock for 30 minutes
    const lock = await CronLock.create({ jobName: 'dailyCleanup', expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
    if (!lock) return;

    logger.info("🧹 [CRON] Initiating nightly database cleanup...");
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    await Donation.updateMany(
      { isEmergency: true, createdAt: { $lt: oneDayAgo }, status: "active" },
      { $set: { status: "expired" } },
    );

    await Donation.updateMany(
      { category: "food", createdAt: { $lt: twoDaysAgo }, status: "active" },
      { $set: { status: "expired" } },
    );

    // Release lock after success
    await CronLock.deleteOne({ jobName: 'dailyCleanup' });
  } catch (err) {
    if (err.code !== 11000) { // Ignore duplicate key errors (means another instance got the lock)
      logger.error("❌ [CRON] Cleanup failed:", err);
    }
  }
});

// 👉 AI & SMART ROUTING: Escalation Engine tick
// Widens the search radius for unanswered SOS blasts through a timeout-driven
// state machine. The CronLock acts as a distributed lock so this stays correct
// across horizontally-scaled instances; all matching/notification logic lives
// in services/escalationEngine.js.
cron.schedule("* * * * *", async () => {
  try {
    const lock = await CronLock.create({ jobName: 'radiusExpansion', expiresAt: new Date(Date.now() + 50 * 1000) });
    if (!lock) return;

    const { escalated, expired } = await runEscalationCycle(io);
    if (escalated > 0 || expired > 0) {
      logger.info(`📡 [CRON] Escalation tick — widened ${escalated} blast(s), expired ${expired}.`);
    }

    await CronLock.deleteOne({ jobName: 'radiusExpansion' });
  } catch (err) {
    if (err.code !== 11000) { // Ignore duplicate key errors (another instance holds the lock)
      logger.error("❌ [CRON] Smart Routing Escalation failed:", err);
    }
  }
});

// ── NO-SHOW DETECTION (hourly) ──
// Donors who were matched (status "pending") but never completed the handshake
// in >24h are flagged as no-shows. The donation resets to active so a new donor can claim it.
cron.schedule("0 * * * *", async () => {
  try {
    const lock = await CronLock.create({ jobName: 'noShowDetection', expiresAt: new Date(Date.now() + 55 * 60 * 1000) });
    if (!lock) return;

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stale = await Donation.find({
      status: "pending",
      updatedAt: { $lt: cutoff },
      receiverId: { $exists: true, $ne: null },
    });

    for (const don of stale) {
      await User.findByIdAndUpdate(don.receiverId, { $inc: { noShowCount: 1 } });
      const prevReceiver = don.receiverId;
      don.status = "active";
      don.receiverId = null;
      // Remove the no-show donor from requestedBy so they can't claim again
      don.requestedBy = (don.requestedBy || []).filter(
        (id) => id.toString() !== prevReceiver.toString()
      );
      await don.save();
      io.to(don.donorId.toString()).emit("request_reset", {
        donationId: don._id,
        donationTitle: don.title,
      });
    }

    if (stale.length > 0) {
      logger.info(`[CRON] No-show detection: reset ${stale.length} stale donation(s)`);
    }
    await CronLock.deleteOne({ jobName: 'noShowDetection' });
  } catch (err) {
    if (err.code !== 11000) logger.error("❌ [CRON] No-show detection failed:", err);
  }
});

// ── WEEKLY DIGEST (Sunday ~9:30am IST = 04:00 UTC) ──
cron.schedule("0 4 * * 0", async () => {
  try {
    const lock = await CronLock.create({ jobName: 'weeklyDigest', expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    if (!lock) return;

    const donors = await User.find({
      fcmToken: { $exists: true, $ne: null, $type: "string" },
      isAvailable: true,
    }).select("fcmToken");

    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      await CronLock.deleteOne({ jobName: 'weeklyDigest' });
      return;
    }

    let sent = 0;
    for (const donor of donors) {
      try {
        await admin.messaging().send({
          token: donor.fcmToken,
          notification: {
            title: "You could save a life today",
            body: "Someone nearby may need your blood group. Stay on-duty on Sahayam.",
          },
          webpush: { fcmOptions: { link: "/" } },
        });
        sent++;
      } catch { /* skip invalid/expired tokens */ }
    }
    logger.info(`[CRON] Weekly digest: notified ${sent} donors`);
    await CronLock.deleteOne({ jobName: 'weeklyDigest' });
  } catch (err) {
    if (err.code !== 11000) logger.error("❌ [CRON] Weekly digest failed:", err);
  }
});

const PORT = process.env.PORT || 5000;

// 👉 GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  logger.error("🔥 [ERROR LOG]: %O", err);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let clientMessage = err.message || "Internal Server Error";

  // 👉 THE FIX: Prevent massive stack traces or HTML logs from breaking the frontend UI Toast
  if (clientMessage.length > 150 || statusCode === 500) {
    clientMessage = "System encountered an unexpected disruption. Logs recorded.";
  }

  res.status(statusCode).json({
    message: clientMessage,
    // Hide stack trace in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", { reason, promise });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("🔥 MongoDB Connected Securely");
    server.listen(PORT, () =>
      logger.info(`🚀 Master Server running on port ${PORT}`),
    );
  })
  .catch((err) => logger.error(err));