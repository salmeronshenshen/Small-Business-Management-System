
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleRegister}>
        <h1>Create Account</h1>
        <p>Small Business Management System</p>

        {message && <div className="message">{message}</div>}

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          required
        />

        <label>Username</label>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />

        <button type="submit">Register</button>

        <p className="auth-link">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;