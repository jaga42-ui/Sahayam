/**
 * Escalation engine — turns an SOS into a timeout-driven state machine.
 *
 * A blast starts BROADCASTING at a tight radius. If nobody responds within the
 * level's wait window, the engine ESCALATES: it widens the radius, finds a fresh
 * ring of eligible donors (never re-pinging anyone) and alerts them. After the
 * final level it EXPIRES. The moment a donor responds the blast becomes MATCHED
 * and escalation stops.
 *
 *   BROADCASTING ──timeout──▶ ESCALATING ──timeout──▶ ESCALATING ──▶ EXPIRED
 *        │                         │                       │
 *        └──────── response ───────┴───────────────────────┘
 *                                  ▼
 *                               MATCHED ──pickup PIN──▶ FULFILLED
 *
 * The cron that calls runEscalationCycle() is guarded by a distributed CronLock
 * (see server.js) so this stays correct across horizontally-scaled instances.
 */

const Blast = require("../models/Blast");
const { findEligibleDonors } = require("./donorMatching");
const { notifyDonors } = require("../utils/notify");

/**
 * The escalation ladder. Index === level - 1. `waitMs` is how long we wait at a
 * level for a response before widening to the next one.
 */
const LEVELS = [
  { level: 1, radiusMeters: 5000, waitMs: 2 * 60 * 1000 }, // 5 km  · 2 min
  { level: 2, radiusMeters: 15000, waitMs: 3 * 60 * 1000 }, // 15 km · 3 min
  { level: 3, radiusMeters: 50000, waitMs: 5 * 60 * 1000 }, // 50 km · 5 min
];

const MAX_LEVEL = LEVELS.length;

function levelConfig(level) {
  return LEVELS[Math.min(level, MAX_LEVEL) - 1];
}

/** When the next escalation should fire, given the level we just pinged at. */
function nextEscalationAt(level, from = Date.now()) {
  return new Date(from + levelConfig(level).waitMs);
}

/**
 * Run one escalation tick. Finds blasts that are still waiting, unanswered, and
 * past their wait window, then widens each one. Safe to call every minute.
 *
 * @param {import('socket.io').Server} [io] optional, to live-update the map
 * @returns {Promise<{escalated:number, expired:number}>}
 */
async function runEscalationCycle(io) {
  const now = new Date();
  const stats = { escalated: 0, expired: 0 };

  const dueBlasts = await Blast.find({
    status: { $in: ["broadcasting", "escalating"] },
    responses: { $size: 0 },
    nextEscalationAt: { $lte: now },
  }).limit(50);

  for (const blast of dueBlasts) {
    const nextLevel = blast.escalationLevel + 1;

    // Final level exhausted → expire.
    if (nextLevel > MAX_LEVEL) {
      blast.status = "expired";
      blast.active = false;
      await blast.save();
      stats.expired += 1;
      if (io) io.emit("blast_expired", { blastId: blast._id });
      continue;
    }

    const cfg = levelConfig(nextLevel);
    const [lng, lat] = blast.location.coordinates;

    const donors = await findEligibleDonors({
      lng,
      lat,
      radiusMeters: cfg.radiusMeters,
      category: blast.category || "blood",
      bloodGroup: blast.bloodGroup,
      excludeIds: [blast.requester, ...blast.pingedDonors],
      limit: 100,
    });

    if (donors.length > 0) {
      await notifyDonors(donors, {
        title: `🚨 EXPANDED ALERT: ${blast.bloodGroup || "Help"} Needed (${cfg.radiusMeters / 1000}km)`,
        body: `Earlier responders are unavailable — we need you now. ${blast.message}`,
        bloodGroup: blast.bloodGroup,
        isEmergency: true,
      });
      blast.pingedDonors.push(...donors.map((d) => d._id));
    }

    blast.status = "escalating";
    blast.escalationLevel = nextLevel;
    blast.pingLevel = nextLevel; // legacy mirror
    blast.radiusMeters = cfg.radiusMeters;
    blast.nextEscalationAt = nextEscalationAt(nextLevel);
    await blast.save();
    stats.escalated += 1;

    if (io) {
      io.emit("blast_escalated", {
        blastId: blast._id,
        level: nextLevel,
        radiusMeters: cfg.radiusMeters,
        reached: donors.length,
      });
    }
  }

  return stats;
}

module.exports = {
  LEVELS,
  MAX_LEVEL,
  levelConfig,
  nextEscalationAt,
  runEscalationCycle,
};
