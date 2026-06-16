const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  toggleRole,
  googleLogin,
  updateProfile,
  getMe,
  updateLocation,
  getNearbyDonors,
  sendEmergencyBlast,
  respondToBlast,
  forgotPassword,
  resetPassword,
  saveFCMToken,
  toggleAvailability,
  verifyEmail,
  donorRarity,
  updateEmergencyContacts,
  familySafetyNet,
  donorPassport,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validateMiddleware');

// Standard Auth
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully (OTP sent)
 *       400:
 *         description: Invalid input or email already exists
 */
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/google', googleLogin);
router.post('/verify-email', verifyEmail);

// Password Reset Routes (Public)
router.post('/forgotpassword', forgotPassword); 
router.post('/resetpassword/:id/:token', resetPassword); 

// Profile, Role & Notifications
router.put('/role', protect, toggleRole);
router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getMe);
router.put('/toggle-availability', protect, toggleAvailability);
router.post('/fcm-token', protect, saveFCMToken); // 👉 NEW: Firebase Token Route

// Map & Radar Routes
router.put('/location', protect, updateLocation);
router.get('/nearby-donors', protect, getNearbyDonors);

// Emergency Blast & Response Routes
router.post('/emergency-blast', protect, sendEmergencyBlast);
router.post('/respond-blast/:id', protect, respondToBlast);

// Donor identity & community features
router.get('/donor-rarity', protect, donorRarity);
router.get('/donor-passport', protect, donorPassport);
router.put('/emergency-contacts', protect, updateEmergencyContacts);
router.get('/family-safety-net', protect, familySafetyNet);

module.exports = router;