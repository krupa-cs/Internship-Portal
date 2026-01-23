const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');
const { calculateTrustScore } = require('../utils/trustScore');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const MAX_OTP_ATTEMPTS = 3;
const MAX_OTP_RESEND_ATTEMPTS = 2;
const OTP_COOLDOWN_MINUTES = 15;
const MIN_SUBMISSION_TIME_SECONDS = 5; // Min time for a human to fill the form
const TRUST_SCORE_THRESHOLD = 30;

/**
 * Helper to generate a new OTP
 */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * 1️⃣ SIGNUP + SEND OTP (WITH BOT DETECTION & TRUST SCORE)
 */
exports.signup = async (req, res) => {
  try {
    const {
      name, email, password, role,
      company_name, company_website, industry, company_size, location, phone,
      honeypot, form_submission_time, captchaToken
    } = req.body;

    // --- BOT DETECTION ---
    if (honeypot) {
      console.log("Bot detected: Honeypot.");
      return res.json({ message: "OTP sent to email" });
    }
    const submissionTime = parseInt(form_submission_time, 10);
    const serverTime = Date.now();
    if (!submissionTime || (serverTime - submissionTime) / 1000 < MIN_SUBMISSION_TIME_SECONDS) {
      console.log("Bot detected: Fast submission.");
      return res.json({ message: "OTP sent to email" });
    }
    if (process.env.NODE_ENV !== 'development' && !captchaToken) {
        return res.status(400).json({ error: "CAPTCHA token is required." });
    }
    if (process.env.NODE_ENV !== 'development') {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
        const captchaResponse = await axios.post(verifyUrl);
        if (!captchaResponse.data.success || captchaResponse.data.score < 0.5) {
            console.log("CAPTCHA failed:", captchaResponse.data);
            return res.json({ message: "OTP sent to email" });
        }
    }
    // --- END BOT DETECTION ---

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otp_expiry = new Date(Date.now() + 5 * 60 * 1000);

    const user_data = {
        name, email, password: hashedPassword, role, otp, otp_expiry,
        is_verified: false,
        company_name, company_website, industry, company_size, location, phone,
        otp_attempts: 0, otp_resend_attempts: 0, otp_cooldown_until: null,
    };

    const user = await prisma.user.upsert({
      where: { email },
      update: user_data,
      create: user_data
    });
    
    // --- TRUST SCORE CALCULATION ---
    if(role === 'Recruiter') {
        const trustScore = await calculateTrustScore({ company_website, company_name });
        let accountStatus = 'active';
        if (trustScore < TRUST_SCORE_THRESHOLD) {
            accountStatus = 'pending_approval';
        }
        await prisma.user.update({
            where: { email },
            data: { trustScore, accountStatus }
        });
    }
    // --- END TRUST SCORE ---

    await sendEmail(email, "Your Verification OTP", `Your OTP for Christ Portal is: ${otp}`);
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred during signup." });
  }
};

/**
 * 2️⃣ VERIFY OTP
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check Cooldown
    if (user.otp_cooldown_until && new Date() < new Date(user.otp_cooldown_until)) {
      const remaining = Math.ceil((new Date(user.otp_cooldown_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Too many attempts. Please try again in ${remaining} minutes.` });
    }

    // Validate OTP
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      const attempts = user.otp_attempts + 1;
      let updateData = { otp_attempts: attempts };

      if (attempts >= MAX_OTP_ATTEMPTS) {
        updateData.otp_cooldown_until = new Date(Date.now() + OTP_COOLDOWN_MINUTES * 60 * 1000);
        updateData.otp_attempts = 0; // Reset for next cycle
      }
      await prisma.user.update({ where: { email }, data: updateData });

      return res.status(400).json({ error: "Invalid or expired OTP." });
    }
    
    // --- SUCCESS ---
    await prisma.user.update({
      where: { email },
      data: {
        is_verified: true,
        otp: null, otp_expiry: null, otp_attempts: 0, otp_resend_attempts: 0, otp_cooldown_until: null
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Verified successfully", token, role: user.role });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "OTP verification failed" });
  }
};

/**
 * 3️⃣ RESEND OTP
 */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check Cooldown
    if (user.otp_cooldown_until && new Date() < new Date(user.otp_cooldown_until)) {
      const remaining = Math.ceil((new Date(user.otp_cooldown_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Cooldown active. Please try again in ${remaining} minutes.` });
    }

    if (user.otp_resend_attempts >= MAX_OTP_RESEND_ATTEMPTS) {
      await prisma.user.update({
        where: { email },
        data: {
          otp_cooldown_until: new Date(Date.now() + OTP_COOLDOWN_MINUTES * 60 * 1000),
          otp_resend_attempts: 0 // Reset for next cycle
        }
      });
      return res.status(429).json({ error: `Max resend attempts reached. Cooldown initiated.` });
    }

    const otp = generateOtp();
    const otp_expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otp_expiry,
        otp_attempts: 0, // Reset attempts on resend
        otp_resend_attempts: user.otp_resend_attempts + 1,
      }
    });

    await sendEmail(email, "Your New Verification OTP", `Your new OTP is: ${otp}`);
    res.json({ message: "New OTP sent." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
};

/**
 * 4️⃣ LOGIN
 */
const { logEvent } = require('../utils/auditLogger');

// ... (previous code)

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.is_verified) {
      // To prevent user enumeration, we won't log failed attempts for non-existent users
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logEvent(user.id, 'login_failed', null, 'User', { ip: req.ip });
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    if (user.accountStatus === 'pending_approval') {
        return res.status(403).json({ error: "Your account is pending admin approval." });
    }
    
    if (user.accountStatus === 'suspended') {
        await logEvent(user.id, 'login_failed_suspended', null, 'User', { ip: req.ip });
        return res.status(403).json({ error: "Your account has been suspended." });
    }

    // --- SUCCESSFUL LOGIN ---
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    
    await logEvent(user.id, 'login_success', null, 'User', { ip: req.ip });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};


/**
 * 5️⃣ FORGOT PASSWORD (SENDS OTP)
 */
exports.forgotPassword = async (req, res) => {
  // This now just becomes a specific case of resending an OTP
  return exports.resendOtp(req, res); 
};


/**
 * 6️⃣ RESET PASSWORD
 */
exports.resetPassword = async (req, res) => {
  // This logic is now identical to verifyOTP, but without token generation
  try {
    const { email, otp, newPassword } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.otp_cooldown_until && new Date() < new Date(user.otp_cooldown_until)) {
      const remaining = Math.ceil((new Date(user.otp_cooldown_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Too many attempts. Please try again in ${remaining} minutes.` });
    }

    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      const attempts = user.otp_attempts + 1;
      let updateData = { otp_attempts: attempts };

      if (attempts >= MAX_OTP_ATTEMPTS) {
        updateData.otp_cooldown_until = new Date(Date.now() + OTP_COOLDOWN_MINUTES * 60 * 1000);
        updateData.otp_attempts = 0;
      }
      await prisma.user.update({ where: { email }, data: updateData });

      return res.status(400).json({ error: "Invalid or expired OTP for password reset." });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null, otp_expiry: null, otp_attempts: 0, otp_resend_attempts: 0, otp_cooldown_until: null
      }
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Password reset failed" });
  }
};
