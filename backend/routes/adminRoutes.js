const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getAllListings,
  deleteUser,
  deleteListing,
  toggleAdminRole,
  toggleBlastBlock,
  sendBroadcast,
  resolveReport,
  getHeatmapData,
  generateMarketingStrategy,
  getCampsAdmin,
  updateCampStatus,
  getKYCRequests,
  approveKYC,
  exportCSV,
} = require('../controllers/adminController');
const { getEngineMetrics } = require('../controllers/metricsController');
const { listReports, updateReportStatus } = require('../controllers/reportController');

const adminGuard = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'You don\'t have access to this area.' });
  }
};

// 🛡️ Apply protection to ALL routes below
router.use(protect, adminGuard);

router.get('/stats', getDashboardStats);
router.get('/engine-metrics', getEngineMetrics); // Routing-engine health (fill rate, response time, escalation depth)
router.get('/heatmap', getHeatmapData);
router.get('/marketing', generateMarketingStrategy);
router.get('/users', getAllUsers);
router.get('/listings', getAllListings);
router.delete('/users/:id', deleteUser);
router.delete('/listings/:id', deleteListing);
router.patch('/users/:id/role', toggleAdminRole);
router.patch('/users/:id/blast-block', toggleBlastBlock);

// 👉 THE NEW MISSION CONTROL ROUTES
router.post('/broadcast', sendBroadcast);
router.patch('/resolve-report/:id', resolveReport);

// Blood camps moderation
router.get('/camps', getCampsAdmin);
router.patch('/camps/:id/status', updateCampStatus);

// KYC verification queue
router.get('/kyc', getKYCRequests);
router.patch('/kyc/:id', approveKYC);

// User reports (harassment/spam/scam) from chat
router.get('/reports', listReports);
router.patch('/reports/:id', updateReportStatus);

// CSV export
router.get('/export', exportCSV);

module.exports = router;