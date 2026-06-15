const asyncHandler = require("express-async-handler");
const Blast = require("../models/Blast");
const { MAX_LEVEL } = require("../services/escalationEngine");

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Engine health metrics — the numbers that show the routing engine actually
 * works: how often SOS calls get answered, how fast, and how deep the
 * escalation ladder has to go. Powers the admin dashboard.
 */
const getEngineMetrics = asyncHandler(async (req, res) => {
  const [statusCounts, levelCounts, responded] = await Promise.all([
    Blast.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Blast.aggregate([{ $group: { _id: "$escalationLevel", count: { $sum: 1 } } }]),
    Blast.find({ firstResponseAt: { $ne: null } })
      .select("createdAt firstResponseAt")
      .lean(),
  ]);

  const byStatus = statusCounts.reduce((acc, s) => {
    acc[s._id || "unknown"] = s.count;
    return acc;
  }, {});

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const answered = (byStatus.matched || 0) + (byStatus.fulfilled || 0);

  // Escalation depth: how many blasts settled at each level (1 = first ring).
  const escalationDepth = {};
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl += 1) escalationDepth[lvl] = 0;
  levelCounts.forEach((l) => {
    if (l._id) escalationDepth[l._id] = l.count;
  });

  const responseTimesSec = responded.map(
    (b) => Math.round((new Date(b.firstResponseAt) - new Date(b.createdAt)) / 1000),
  );

  res.json({
    totalBlasts: total,
    byStatus,
    fillRate: total ? Number((answered / total).toFixed(3)) : 0,
    medianTimeToFirstResponseSec: median(responseTimesSec),
    answeredCount: answered,
    escalationDepth,
    generatedAt: new Date(),
  });
});

module.exports = { getEngineMetrics };
