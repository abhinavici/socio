const User = require("../models/User");
const Otp = require("../models/Otp");
const Counter = require("../models/Counter");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { generateOtp, sendOtpEmail } = require("../utils/email");

const MIN_PASSWORD_LENGTH = 6;

// ─────────────────────────────────────────────
// REGISTRATION FLOW
// ─────────────────────────────────────────────

// Step 1: Send OTP to email for registration
// POST /auth/register/send-otp
exports.sendRegisterOtp = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (!trimmedName || !normalizedEmail || !password) {
    return next(httpError(400, "Name, email, and password are required"));
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return next(httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`));
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(httpError(400, "User already exists"));
  }

  await Otp.deleteMany({ email: normalizedEmail, type: "register" });

  const otp = generateOtp();
  await Otp.create({ email: normalizedEmail, otp, type: "register" });
  await sendOtpEmail(normalizedEmail, otp, "register");

  res.status(200).json({ message: "OTP sent to your email" });
});

// Step 2: Verify OTP and create account
// POST /auth/register/verify-otp
exports.verifyRegisterOtp = asyncHandler(async (req, res, next) => {
  const { name, email, password, otp } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (!trimmedName || !normalizedEmail || !password || !otp) {
    return next(httpError(400, "All fields including OTP are required"));
  }

  const otpRecord = await Otp.findOne({ email: normalizedEmail, type: "register" });

  if (!otpRecord) {
    return next(httpError(400, "OTP expired or not found. Please try again."));
  }

  if (otpRecord.otp !== otp.trim()) {
    return next(httpError(400, "Invalid OTP"));
  }

  await Otp.deleteMany({ email: normalizedEmail, type: "register" });

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(httpError(400, "User already exists"));
  }

const hashedPassword = await bcrypt.hash(password, 10);

// Generate unique userId
const counter = await Counter.findOneAndUpdate(
  { name: "userId" },
  { $inc: { value: 1 } },
  { new: true, upsert: true }
);
const userId = `USR-${counter.value}`;

// Generate username from name (e.g. "John Doe" → "john_doe_1001")
const baseUsername = trimmedName.toLowerCase().replace(/\s+/g, "_");
const username = `${baseUsername}_${counter.value}`;

await User.create({
  userId,
  username,
  name: trimmedName,
  email: normalizedEmail,
  password: hashedPassword,
});

  res.status(201).json({ message: "Account created successfully" });
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !password) {
    return next(httpError(400, "Email and password are required"));
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return next(httpError(400, "Invalid credentials"));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(httpError(400, "Invalid credentials"));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ token });
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD FLOW
// ─────────────────────────────────────────────

// Step 1: Send OTP
// POST /auth/forgot-password/send-otp
exports.sendResetOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return next(httpError(400, "Email is required"));
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Prevent email enumeration
    return res.status(200).json({ message: "If that email exists, an OTP has been sent" });
  }

  await Otp.deleteMany({ email: normalizedEmail, type: "reset" });

  const otp = generateOtp();
  await Otp.create({ email: normalizedEmail, otp, type: "reset" });
  await sendOtpEmail(normalizedEmail, otp, "reset");

  res.status(200).json({ message: "If that email exists, an OTP has been sent" });
});

// Step 2: Verify OTP → return short-lived reset token
// POST /auth/forgot-password/verify-otp
exports.verifyResetOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !otp) {
    return next(httpError(400, "Email and OTP are required"));
  }

  const otpRecord = await Otp.findOne({ email: normalizedEmail, type: "reset" });

  if (!otpRecord) {
    return next(httpError(400, "OTP expired or not found. Please request a new one."));
  }

  if (otpRecord.otp !== otp.trim()) {
    return next(httpError(400, "Invalid OTP"));
  }

  const resetToken = jwt.sign(
    { email: normalizedEmail, purpose: "reset" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  await Otp.deleteMany({ email: normalizedEmail, type: "reset" });

  res.status(200).json({ resetToken });
});

// Step 3: Reset password
// POST /auth/forgot-password/reset
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return next(httpError(400, "Reset token and new password are required"));
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return next(httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`));
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return next(httpError(400, "Reset token is invalid or expired"));
  }

  if (payload.purpose !== "reset") {
    return next(httpError(400, "Invalid token purpose"));
  }

  const user = await User.findOne({ email: payload.email });
  if (!user) {
    return next(httpError(404, "User not found"));
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
});
