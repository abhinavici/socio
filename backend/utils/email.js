const axios = require("axios");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to, otp, type) {
  const subject =
    type === "register"
      ? "Task Pilot – Verify your email"
      : "Task Pilot – Password reset code";

  const heading =
    type === "register" ? "Verify your email address" : "Reset your password";

  const description =
    type === "register"
      ? "Use the code below to complete your registration. It expires in 10 minutes."
      : "Use the code below to reset your password. It expires in 10 minutes.";

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #fdf7ef; border-radius: 16px; overflow: hidden; border: 1px solid #e8ddd0;">
      <div style="background: linear-gradient(135deg, #147d71, #0b5f56); padding: 32px 32px 24px; text-align: center;">
        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Task Pilot</p>
        <h1 style="margin: 8px 0 0; color: #fff; font-size: 22px; font-weight: 700;">${heading}</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #4b5f75; margin: 0 0 24px;">${description}</p>
        <div style="background: #fff; border: 2px dashed #147d71; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #12263a;">${otp}</p>
        </div>
        <p style="color: #4b5f75; font-size: 13px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Socio", email: "b25.abhinav@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { generateOtp, sendOtpEmail };