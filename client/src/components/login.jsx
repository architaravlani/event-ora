
import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to log in.");
      }

      if (!data.token) {
        throw new Error("Login succeeded, but no authentication token was returned.");
      }

      localStorage.setItem("eventoraToken", data.token);

      if (data.user) {
        localStorage.setItem("eventoraUser", JSON.stringify(data.user));
      }

      setMessage("Welcome back! Signing you in…");
      setMessageType("success");

      if (onLogin) {
        onLogin(data);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || "Login failed. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="eventora-login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <nav className="login-topbar">
        <button
          className="login-brand"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Eventora home"
        >
          <span className="brand-symbol">E</span>
          <span>eventora<span className="brand-period">.</span></span>
        </button>

        <div className="login-top-note">
          <span className="online-dot" />
          Your next great experience starts here
        </div>
      </nav>

      <section className="login-main">
        <div className="login-showcase">
          <div className="showcase-eyebrow">
            <span className="eyebrow-line" />
            DISCOVER. CONNECT. EXPERIENCE.
          </div>

          <h1>
            Life happens
            <br />
            <span>at the event.</span>
          </h1>

          <p className="showcase-description">
            Discover unforgettable experiences, find your people,
            and make every moment worth remembering.
          </p>

          <div className="showcase-feature-list">
            <div className="showcase-feature">
              <span className="feature-icon">✦</span>
              <div>
                <strong>Discover experiences</strong>
                <span>Find events that match your vibe.</span>
              </div>
            </div>

            <div className="showcase-feature">
              <span className="feature-icon">↗</span>
              <div>
                <strong>Book with confidence</strong>
                <span>Keep your event bookings in one place.</span>
              </div>
            </div>
          </div>

          <div className="showcase-bottom">
            <span className="showcase-star">✳</span>
            <span>Make room for moments that matter.</span>
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-card">
            <div className="login-card-top">
              <div className="login-card-icon">✦</div>
              <span className="secure-label">
                <span className="secure-dot" />
                SECURE SIGN IN
              </span>
            </div>

            <div className="login-heading">
              <p className="login-overline">WELCOME BACK</p>
              <h2>Good to see you.</h2>
              <p>Sign in to continue your Eventora journey.</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-input-group">
                <label htmlFor="eventora-email">Email address</label>
                <div className="login-input-wrap">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
                      <path d="m5 7 7 5.5L19 7" />
                    </svg>
                  </span>
                  <input
                    id="eventora-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label htmlFor="eventora-password">Password</label>
                <div className="login-input-wrap">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      <path d="M12 14v2" />
                    </svg>
                  </span>
                  <input
                    id="eventora-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>{loading ? "Signing you in…" : "Sign in to Eventora"}</span>
                {!loading && <span className="submit-arrow">↗</span>}
                {loading && <span className="login-spinner" />}
              </button>

              {message && (
                <div
                  className={`login-feedback ${messageType}`}
                  role="status"
                  aria-live="polite"
                >
                  <span>{messageType === "success" ? "✓" : "!"}</span>
                  {message}
                </div>
              )}
            </form>

            <div className="login-divider">
              <span />
              <span>NEW TO EVENTORA?</span>
              <span />
            </div>

            <button
              type="button"
              className="login-register"
              onClick={onRegister}
            >
              Create your account <span>↗</span>
            </button>

            <p className="login-terms">
              By signing in, you agree to use Eventora responsibly.
            </p>
          </div>

          <p className="login-footer-note">
            <span>✦</span> Every great memory starts somewhere.
          </p>
        </div>
      </section>

      <footer className="login-page-footer">
        <span>© {new Date().getFullYear()} Eventora</span>
        <span>MADE FOR YOUR NEXT BIG MOMENT</span>
      </footer>
    </main>
  );
}

export default Login;
