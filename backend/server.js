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
const Blast = require("./models/Blast");
const User = require("./models/User");
const CronLock = require("./models/CronLock");
const admin = require("firebase-admin");
const { protect } = require("./middleware/authMiddleware");

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

// 👉 AI & SMART ROUTING: Radius Expansion Job
cron.schedule("* * * * *", async () => {
  try {
    // Distributed lock for horizontal scaling (expires in 50 seconds)
    const lock = await CronLock.create({ jobName: 'radiusExpansion', expiresAt: new Date(Date.now() + 50 * 1000) });
    if (!lock) return;

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    // Find active blasts stuck at level 1 with no responses
    const stalledBlasts = await Blast.find({
      pingLevel: 1,
      active: true,
      responses: { $size: 0 },
      createdAt: { $lt: twoMinutesAgo }
    });

    if (stalledBlasts.length > 0) {
      logger.info(`📡 [CRON] Expanding radius for ${stalledBlasts.length} stalled emergency blasts.`);
    }

    for (let blast of stalledBlasts) {
      const [lng, lat] = blast.location.coordinates;
      
      // Query the next 100 closest donors, excluding those already pinged
      const expandedDonors = await User.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 50000, // Expand to 50km
          },
        },
        activeRole: "donor",
        isAvailable: true,
        _id: { $nin: [...blast.pingedDonors, blast.requester] },
      }).limit(100);

      if (expandedDonors.length > 0) {
        const pushTokens = expandedDonors
          .filter(d => d.fcmToken)
          .map(d => d.fcmToken);

        if (pushTokens.length > 0 && admin.apps.length > 0) {
          const pushMessage = {
            notification: {
              title: `🚨 EXPANDED ALERT: ${blast.bloodGroup || "Help"} Needed!`,
              body: "Original responders are unavailable. We need you now! " + blast.message,
            },
            tokens: pushTokens,
          };
          admin.messaging().sendEachForMulticast(pushMessage).catch(console.error);
        }

        // 👉 THE FIX: 100% Free Email Fallback instead of Paid Twilio SMS
        const fallbackEmails = expandedDonors.filter(d => d.email).map(d => d.email);
        if (fallbackEmails.length > 0) {
          const { sendPostAlertEmail } = require("./utils/sendEmail");
          sendPostAlertEmail(fallbackEmails, {
            message: "Original responders failed to answer. We are expanding the radius! " + blast.message,
            bloodGroup: blast.bloodGroup,
            isEmergency: true
          }).catch(console.error);
        }

        // Update Blast
        blast.pingLevel = 2;
        blast.pingedDonors.push(...expandedDonors.map(d => d._id));
        await blast.save();
      }
    }

    await CronLock.deleteOne({ jobName: 'radiusExpansion' });
  } catch (err) {
    if (err.code !== 11000) { // Ignore duplicate key errors
      logger.error("❌ [CRON] Smart Routing Expansion failed:", err);
    }
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