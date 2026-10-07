import { useState } from "react";

function Register({ onRegister, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed."
        );
      }

      // Backend returns token after registration
      if (data.token) {
        localStorage.setItem(
          "eventoraToken",
          data.token
        );
      }

      // Save user information
      if (data.user) {
        localStorage.setItem(
          "eventoraUser",
          JSON.stringify(data.user)
        );
      }

      setMessage("Registration successful!");

      if (onRegister) {
        onRegister(data);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(
        error.message || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="hero-badge">
          ✦ Join Eventora
        </div>

        <h1>
          Create your <span>account</span>
        </h1>

        <p>
          Register to create and manage amazing events.
        </p>

        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

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
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <div className="auth-switch">
          <span>Already have an account? </span>

          <button
            type="button"
            className="link-button"
            onClick={onLogin}
          >
            Login
          </button>
        </div>
      </div>
    </section>
  );
}

export default Register;