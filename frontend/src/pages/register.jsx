
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullname,
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Cannot connect to server.");
    }
  };

  return (
    <div className="sb-auth-container">

      {/* BACKGROUND DECORATIONS */}
      <div className="sb-decoration heart-one">♡</div>
      <div className="sb-decoration heart-two">♥</div>
      <div className="sb-decoration heart-three">♡</div>
      <div className="sb-decoration heart-four">♥</div>
      <div className="sb-decoration sparkle-one">✦</div>
      <div className="sb-decoration sparkle-two">✦</div>

      <form className="sb-auth-card" onSubmit={handleRegister}>

        {/* STORE IMAGE */}
        <div className="sb-store-image">
          <img
            src="/store.png"
            alt="Small Business Store"
          />
        </div>

        {/* BRAND */}
        <div className="sb-brand">
          <h2>Small Business</h2>
          <p>By Shen</p>
        </div>

        {/* HEADING */}
        <h1 className="sb-register-heading">
          Create Your Account
        </h1>

        <p className="sb-subtitle">
          Join Small Business and grow your business.
        </p>

        {/* HEART DIVIDER */}
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

        {/* FULL NAME */}
        <div className="sb-input-group">
          <label>
            <span className="sb-field-icon">♟</span>
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            required
          />
        </div>

        {/* USERNAME */}
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

        {/* PASSWORD */}
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
              minLength="6"
            />

            <button
              type="button"
              className="sb-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* REGISTER BUTTON */}
        <button type="submit" className="sb-login-button">
          Register
        </button>

        {/* LOGIN LINK */}
        <p className="sb-auth-link">
          Already have an account?
          <Link to="/">Login</Link>
        </p>

      </form>
    </div>
  );
}

export default Register;
