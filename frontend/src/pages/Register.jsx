import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";

// Step indicators
const STEPS = {
  FORM: "form",
  OTP: "otp",
};

function Register() {
  const [step, setStep] = useState(STEPS.FORM);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Name, email, and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await API.post("/auth/register/send-otp", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSuccessMessage(`OTP sent to ${email.trim()}`);
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
      await API.post("/auth/register/send-otp", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSuccessMessage("A new OTP has been sent to your email.");
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
      await API.post("/auth/register/verify-otp", {
        name: name.trim(),
        email: email.trim(),
        password,
        otp: otp.trim(),
      });
      navigate("/login", {
        replace: true,
        state: { message: "Account created! Please sign in." },
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "OTP verification failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="auth-card">
        <p className="auth-eyebrow">Task Pilot</p>
        <h1 className="auth-title">
          {step === STEPS.FORM ? "Create your account" : "Verify your email"}
        </h1>
        <p className="auth-subtitle">
          {step === STEPS.FORM
            ? "Track work, personal items, and deadlines with a board designed for quick momentum."
            : `We sent a 6-digit code to ${email}. Enter it below to confirm your account.`}
        </p>

        {successMessage ? <p className="notice success">{successMessage}</p> : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {step === STEPS.FORM && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <label className="input-label" htmlFor="register-name">Name</label>
            <input
              id="register-name"
              className="input-field"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />

            <label className="input-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label className="input-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className="input-field"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Continue"}
            </button>
          </form>
        )}

        {step === STEPS.OTP && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <label className="input-label" htmlFor="register-otp">6-digit OTP</label>
            <input
              id="register-otp"
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
              {isSubmitting ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div className="otp-footer">
              <button
                type="button"
                className="btn-link"
                onClick={handleResend}
                disabled={isSubmitting}
              >
                Resend OTP
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => { setStep(STEPS.FORM); setErrorMessage(""); setSuccessMessage(""); setOtp(""); }}
              >
                Edit details
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Back to login</Link>
        </p>
      </main>
    </div>
  );
}

export default Register;
