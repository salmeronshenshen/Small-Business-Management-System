
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!fullname.trim() || !username.trim() || !password) {
      setMessage("Please complete all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullname: fullname.trim(),
            username: username.trim(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/");
      } else {
        setMessage(
          data.message || "Registration failed. Please try again."
        );
      }

    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sb-login-page sb-register-page">

      <div className="sb-login-card sb-register-card">

        {/* LEFT BRANDING PANEL */}
        <div className="sb-login-brand-panel">

          <div className="sb-brand-logo">
            BF
          </div>

          <p className="sb-brand-label">
            YOUR BEAUTY DESTINATION
          </p>

          <h1 className="sb-brand-title">
            Beauty Finds<span>.</span>
          </h1>

          <p className="sb-brand-description">
            Discover your beauty. Express your style.
            Find the products that make you feel confident.
          </p>

          {/* BEAUTY DECORATIONS */}
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

        {/* RIGHT REGISTER PANEL */}
        <div className="sb-login-form-panel">

          <div className="sb-login-top">

            <span className="sb-login-small-logo">
              BF.
            </span>

            <span className="sb-secure-label">
              <span className="sb-secure-dot"></span>
              CREATE ACCOUNT
            </span>

          </div>

          <div className="sb-login-content">

            {/* HEADING */}
            <div className="sb-login-heading">

              <p className="sb-welcome-label">
                JOIN BEAUTY FINDS
              </p>

              <h2>Create your account</h2>

              <p>
                Sign up today and discover your favorite
                beauty products.
              </p>

            </div>

            {/* ERROR MESSAGE */}
            {message && (
              <div className="sb-login-message">
                {message}
              </div>
            )}

            <form onSubmit={handleRegister}>

              {/* FULL NAME */}
              <div className="sb-form-group">

                <label htmlFor="sb-fullname">
                  Full Name
                </label>

                <div className="sb-input-wrapper">

                  <span className="sb-input-icon">
                    ♙
                  </span>

                  <input
                    id="sb-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    autoComplete="name"
                    required
                  />

                </div>

              </div>

              {/* USERNAME */}
              <div className="sb-form-group">

                <label htmlFor="sb-register-username">
                  Username
                </label>

                <div className="sb-input-wrapper">

                  <span className="sb-input-icon">
                    ♙
                  </span>

                  <input
                    id="sb-register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="sb-form-group">

                <label htmlFor="sb-register-password">
                  Password
                </label>

                <div className="sb-input-wrapper">

                  <span className="sb-input-icon">
                    🔒
                  </span>

                  <input
                    id="sb-register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
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

                <p className="sb-register-hint">
                  Password must be at least 6 characters.
                </p>

              </div>

              {/* REGISTER BUTTON */}
              <button
                type="submit"
                className="sb-login-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}

                {!loading && <span>→</span>}
              </button>

            </form>

            {/* LOGIN LINK */}
            <div className="sb-login-register">
              Already have an account?
              <Link to="/">
                Sign In
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

export default Register;
