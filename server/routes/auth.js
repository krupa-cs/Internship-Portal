const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup + OTP
router.post('/signup', authController.signup);

// Verify OTP
router.post('/verify-otp', authController.verifyOTP);

// Login
router.post('/login', authController.login);

// Forgot & Reset password
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
