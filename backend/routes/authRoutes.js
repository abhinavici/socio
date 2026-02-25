const express = require("express");
const router = express.Router();
const {
  sendRegisterOtp,
  verifyRegisterOtp,
  loginUser,
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

// Registration with OTP
router.post("/register/send-otp", sendRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);

// Login
router.post("/login", loginUser);

// Forgot password with OTP
router.post("/forgot-password/send-otp", sendResetOtp);
router.post("/forgot-password/verify-otp", verifyResetOtp);
router.post("/forgot-password/reset", resetPassword);

module.exports = router;
