import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import { getToken, isTokenValid, setToken } from "../utils/auth";
import { getErrorMessage } from "../utils/http";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const existingToken = getToken();
    if (isTokenValid(existingToken)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data } = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      setToken(data.token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Login failed. Check your credentials."));
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">
          Focus your day with one clean board for priorities, progress, and done tasks.
        </p>

        {location.state?.message ? <p className="notice success">{location.state.message}</p> : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="input-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <label className="input-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="input-field"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <p style={{ textAlign: "center", margin: "4px 0 0" }}>
            <Link to="/forgot-password" style={{ fontSize: "14px" }}>Forgot password?</Link>
          </p>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create account</Link>
        </p>
      </main>
    </div>
  );
}

export default Login;
