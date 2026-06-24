const asyncHandler = require("express-async-handler");
const Report = require("../models/Report");

// @route GET /api/admin/reports  — admin-gated by adminRoutes
const listReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate("reporter", "name email")
    .populate("reportedUser", "name email noShowCount")
    .sort({ status: 1, createdAt: -1 }) // open first, newest first
    .limit(200);
  res.json(reports);
});

// @route PATCH /api/admin/reports/:id  { status }
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["open", "reviewed", "actioned"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status.");
  }
  const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!report) {
    res.status(404);
    throw new Error("Report not found.");
  }
  res.json(report);
});

module.exports = { listReports, updateReportStatus };
