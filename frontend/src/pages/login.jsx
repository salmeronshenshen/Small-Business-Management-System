
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
      const role = String(data.user.role || "")
        .trim()
        .toLowerCase();

      if (role === "admin" || role === "staff") {
        navigate("/dashboard");
      } else if (role === "customer") {
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
    <div className="sb-login-page">

      <div className="sb-login-card">

        {/* LEFT BRANDING PANEL */}
        <div className="sb-login-brand-panel">

          <div className="sb-brand-logo">
            BF
          </div>

          <p className="sb-brand-label">
            YOUR BEAUTY DESTINATION
          </p>

          <h1 className="sb-brand-title">
            Beauty Finds♥<span>.</span>
          </h1>

          <p className="sb-brand-description">
            Discover your beauty. Express your style.
            Find the products that make you feel confident.
          </p>

          <div className="sb-brand-art">

            <div className="sb-art-circle"></div>

            <div className="sb-art-product sb-art-one">
              💄
            </div>

            <div className="sb-art-product sb-art-two">
              🧴
            </div>

            <div className="sb-art-product sb-art-three">
              ✨
            </div>

            <div className="sb-art-product sb-art-four">
              🌸
            </div>

          </div>

          <div className="sb-brand-footer">
            BEAUTY • CONFIDENCE • YOU
          </div>

        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="sb-login-form-panel">

          <div className="sb-login-top">

            <span className="sb-login-small-logo">
              BF.
            </span>

            <span className="sb-secure-label">
              <span className="sb-secure-dot"></span>
              SECURE LOGIN
            </span>

          </div>

          <div className="sb-login-content">

            <div className="sb-login-heading">

              <p className="sb-welcome-label">
                WELCOME BACK
              </p>

              <h2>Sign in to your account</h2>

              <p>
                Enter your account details to continue
                shopping with Beauty Finds.
              </p>

            </div>

            {message && (
              <div className="sb-login-message">
                {message}
              </div>
            )}

            <form onSubmit={handleLogin}>

              {/* USERNAME */}
              <div className="sb-form-group">

                <label htmlFor="sb-username">
                  Username
                </label>

                <div className="sb-input-wrapper">

                  <span className="sb-input-icon">
                    ♙
                  </span>

                  <input
                    id="sb-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="sb-form-group">

                <label htmlFor="sb-password">
                  Password
                </label>

                <div className="sb-input-wrapper">

                  <span className="sb-input-icon">
                    🔒
                  </span>

                  <input
                    id="sb-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="sb-password-toggle"
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
                className="sb-login-submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}

                {!loading && <span>→</span>}
              </button>

            </form>

            <div className="sb-login-register">
              Don't have an account?
              <Link to="/register">
                Create an account
              </Link>
            </div>

          </div>

          <div className="sb-login-bottom">
            <span>© 2026 Beauty Finds</span>
            <span>Made for your beauty journey ♡</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
