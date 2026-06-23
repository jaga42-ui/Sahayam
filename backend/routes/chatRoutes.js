const express = require('express');
const router = express.Router();
const {
  getInbox, getChatHistory, sendMessage, deleteMessage, editMessage,
  markMessagesAsRead, blockUser, unblockUser, reportUser,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Block & report — declared before the param routes so "/block" and "/report"
// aren't captured as a :donationId / :id.
router.post('/block/:userId', protect, blockUser);
router.delete('/block/:userId', protect, unblockUser);
router.post('/report', protect, reportUser);

router.get('/inbox', protect, getInbox);
router.get('/:donationId', protect, getChatHistory);
router.post('/', protect, sendMessage);

// 👉 NEW: Edit and Delete routes
router.delete('/:id', protect, deleteMessage);
router.put('/:id', protect, editMessage);
router.put('/:donationId/read', protect, markMessagesAsRead);

module.exports = router;