
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
    <div className="bf-login-container">

      {/* BACKGROUND DECORATIONS */}
      <div className="bf-decoration bf-heart-one">♡</div>
      <div className="bf-decoration bf-heart-two">♡</div>
      <div className="bf-decoration bf-heart-three">✦</div>
      <div className="bf-decoration bf-heart-four">♡</div>
      <div className="bf-decoration bf-sparkle-one">✧</div>
      <div className="bf-decoration bf-sparkle-two">✦</div>

      {/* LOGIN CARD */}
      <form className="bf-login-card" onSubmit={handleLogin}>

        {/* BRAND */}
        <div className="bf-brand-icon">
          <span>BF</span>
        </div>

        <div className="bf-brand-name">
          <h2>Beauty Finds</h2>
          <p>YOUR BEAUTY, YOUR STYLE</p>
        </div>

        <div className="bf-divider">
          <span></span>
          <b>♡</b>
          <span></span>
        </div>

        {/* WELCOME TEXT */}
        <div className="bf-welcome">
          <h1>Welcome Back!</h1>
          <p>Sign in to your account to continue.</p>
        </div>

        {/* ERROR MESSAGE */}
        {message && (
          <div className="bf-message">
            {message}
          </div>
        )}

        {/* USERNAME */}
        <div className="bf-input-group">
          <label>Username</label>

          <div className="bf-input-wrapper">
            <span className="bf-input-icon">♙</span>

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="bf-input-group">
          <label>Password</label>

          <div className="bf-input-wrapper">
            <span className="bf-input-icon">♙</span>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="bf-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          className="bf-login-button"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        {/* REGISTER LINK */}
        <p className="bf-register-link">
          Don't have an account?
          <Link to="/register"> Create Account</Link>
        </p>

        {/* FOOTER */}
        <div className="bf-login-footer">
          <span>♡</span> Beauty Finds — Your Beauty Destination
        </div>

      </form>
    </div>
  );
}

export default Login;
