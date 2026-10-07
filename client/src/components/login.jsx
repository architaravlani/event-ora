import { useState } from "react";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      // Save JWT
      localStorage.setItem("eventoraToken", data.token);

      // Save user
      if (data.user) {
        localStorage.setItem(
          "eventoraUser",
          JSON.stringify(data.user)
        );
      }

      setMessage("Login successful!");

      if (onLogin) {
        onLogin(data);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="hero-badge">
          ✦ Welcome to Eventora
        </div>

        <h1>
          Login to <span>Eventora</span>
        </h1>

        <p>
          Login to create events and manage your Eventora experience.
        </p>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <div className="auth-switch">
          <span>Don't have an account? </span>

          <button
            type="button"
            className="link-button"
            onClick={onRegister}
          >
            Register
          </button>
        </div>
      </div>
    </section>
  );
}

export default Login;