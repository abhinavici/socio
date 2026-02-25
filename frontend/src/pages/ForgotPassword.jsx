import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";

const STEPS = {
  EMAIL: "email",
  OTP: "otp",
  RESET: "reset",
  DONE: "done",
};

function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await API.post("/auth/forgot-password/send-otp", { email: email.trim() });
      setSuccessMessage(`If an account exists for ${email.trim()}, we've sent an OTP.`);
      setStep(STEPS.OTP);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to send OTP. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      setIsSubmitting(true);
      await API.post("/auth/forgot-password/send-otp", { email: email.trim() });
      setSuccessMessage("A new OTP has been sent.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to resend OTP."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await API.post("/auth/forgot-password/verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
      });
      setResetToken(data.resetToken);
      setSuccessMessage("");
      setStep(STEPS.RESET);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "OTP verification failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await API.post("/auth/forgot-password/reset", {
        resetToken,
        newPassword,
      });
      setStep(STEPS.DONE);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Password reset failed. Please start over."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = {
    [STEPS.EMAIL]: "Forgot password",
    [STEPS.OTP]: "Enter your OTP",
    [STEPS.RESET]: "Set new password",
    [STEPS.DONE]: "All done!",
  };

  const stepSubtitles = {
    [STEPS.EMAIL]: "Enter your registered email and we'll send you a 6-digit code.",
    [STEPS.OTP]: `Enter the 6-digit code we sent to ${email}.`,
    [STEPS.RESET]: "Choose a strong new password for your account.",
    [STEPS.DONE]: "Your password has been updated. You can now sign in.",
  };

  return (
    <div className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="auth-card">
        <p className="auth-eyebrow">Task Pilot</p>
        <h1 className="auth-title">{stepTitles[step]}</h1>
        <p className="auth-subtitle">{stepSubtitles[step]}</p>

        {successMessage ? <p className="notice success">{successMessage}</p> : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {/* Step progress dots */}
        <div className="otp-steps">
          {[STEPS.EMAIL, STEPS.OTP, STEPS.RESET].map((s, i) => (
            <span
              key={s}
              className={`otp-step-dot ${step === s ? "active" : step === STEPS.DONE || [STEPS.EMAIL, STEPS.OTP, STEPS.RESET].indexOf(step) > i ? "done" : ""}`}
            />
          ))}
        </div>

        {step === STEPS.EMAIL && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <label className="input-label" htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === STEPS.OTP && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <label className="input-label" htmlFor="fp-otp">6-digit OTP</label>
            <input
              id="fp-otp"
              className="input-field otp-input"
              type="text"
              inputMode="numeric"
              placeholder="••••••"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoFocus
              autoComplete="one-time-code"
            />
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="otp-footer">
              <button type="button" className="btn-link" onClick={handleResend} disabled={isSubmitting}>
                Resend OTP
              </button>
              <button type="button" className="btn-link" onClick={() => { setStep(STEPS.EMAIL); setErrorMessage(""); setSuccessMessage(""); setOtp(""); }}>
                Change email
              </button>
            </div>
          </form>
        )}

        {step === STEPS.RESET && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label className="input-label" htmlFor="fp-newpw">New password</label>
            <input
              id="fp-newpw"
              className="input-field"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            <label className="input-label" htmlFor="fp-confirmpw">Confirm password</label>
            <input
              id="fp-confirmpw"
              className="input-field"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === STEPS.DONE && (
          <button className="btn btn-primary" style={{ marginTop: "8px" }} onClick={() => navigate("/login", { replace: true })}>
            Go to Login
          </button>
        )}

        <p className="auth-switch">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </main>
    </div>
  );
}

export default ForgotPassword;
