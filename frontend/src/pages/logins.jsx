import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username.trim() || !password) {
      setMessage("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid username or password.");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("Invalid server response. Please try again.");
        return;
      }

      // SAVE LOGIN INFORMATION
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // REDIRECT BASED ON USER ROLE
      if (
        data.user.role === "Admin" ||
        data.user.role === "Staff"
      ) {
        navigate("/dashboard");
      } else if (data.user.role === "Customer") {
        navigate("/customer-dashboard");
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMessage("Invalid account role.");
      }

    } catch (error) {
      console.error("Login error:", error);
      setMessage("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sb-auth-container">

      <div className="sb-decoration heart-one">♡</div>
      <div className="sb-decoration heart-two">♥</div>
      <div className="sb-decoration heart-three">♡</div>
      <div className="sb-decoration heart-four">♥</div>
      <div className="sb-decoration sparkle-one">✦</div>
      <div className="sb-decoration sparkle-two">✦</div>

      <form className="sb-auth-card" onSubmit={handleLogin}>

        <div className="sb-store-image">
          <img src="/store.png" alt="Small Business Store" />
        </div>

        <div className="sb-brand">
          <h2>Small Business</h2>
        </div>

        <h1>Welcome!</h1>

        <p className="sb-subtitle">
          Sign in to your small business account.
        </p>

        <div className="sb-divider">
          <span></span>
          <b>♥</b>
          <span></span>
        </div>

        {message && (
          <div className="sb-message">
            {message}
          </div>
        )}

        <div className="sb-input-group">
          <label>
            <span className="sb-field-icon">♟</span>
            Username
          </label>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="sb-input-group">
          <label>
            <span className="sb-field-icon">🔒</span>
            Password
          </label>

          <div className="sb-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="sb-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="sb-login-button"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="sb-auth-link">
          Don't have an account?
          <Link to="/register">Register</Link>
        </p>

      </form>
    </div>
  );
}

export default Login;