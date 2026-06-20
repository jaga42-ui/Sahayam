const express = require('express');
const router = express.Router();

// 👉 IMPORT YOUR NEW CLOUDINARY ENGINE
const { upload } = require('../config/cloudinary');

const {
  createDonation,
  getDonations,
  getNearbyFeed,
  getMyHistory,
  deleteDonation,
  markFulfilled,
  requestItem,
  approveRequest,
  acceptSOS,
  reportDonation,
  triageSOS,
  sendThankYou,
  relistDonation,
  receiverConfirm,
} = require('../controllers/donationController');

const { protect } = require('../middleware/authMiddleware');

// 👉 The Routes
router.route('/')
  .post(protect, upload.single('image'), createDonation)
  .get(protect, getDonations); 

router.get('/feed', protect, getNearbyFeed);
router.get('/my-history', protect, getMyHistory);
router.patch('/:id/fulfill', protect, markFulfilled);
router.delete('/:id', protect, deleteDonation);

// 👉 The Marketplace Request Routes
router.post('/:id/request', protect, requestItem);
router.patch('/:id/approve', protect, approveRequest);

// 👉 The Emergency SOS Accept Route
router.patch('/:id/sos-accept', protect, acceptSOS);

// 👉 NEW: The Report & Auto-Moderation Route
router.put('/:id/report', protect, reportDonation);

// AI Triage Assistant
router.post('/triage', protect, triageSOS);

// Thank You after fulfillment
router.post('/:id/thank', protect, sendThankYou);

// Re-list an expired/fulfilled donation
router.post('/:id/relist', protect, relistDonation);

// Receiver confirms they are coming
router.patch('/:id/receiver-confirm', protect, receiverConfirm);

module.exports = router;