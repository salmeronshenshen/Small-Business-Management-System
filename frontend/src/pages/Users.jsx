
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Staff");

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const savedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    if (savedUser.role !== "Admin") {
      navigate("/");
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        setMessage(data.message || "Unable to load users.");
      }
    } catch (error) {
      console.error("Users error:", error);
      setMessage("Cannot connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullname("");
    setUsername("");
    setPassword("");
    setRole("Staff");
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!fullname.trim() || !username.trim()) {
      setMessage("Please complete the required fields.");
      return;
    }

    if (!editId && !password.trim()) {
      setMessage("Password is required for a new account.");
      return;
    }

    if (password && password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    const userData = {
      fullname: fullname.trim(),
      username: username.trim(),
      role
    };

    if (password.trim()) {
      userData.password = password;
    }

    try {
      const url = editId
        ? `http://localhost:5000/api/users/${editId}`
        : "http://localhost:5000/api/users";

      const response = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          editId
            ? "User updated successfully!"
            : "User added successfully!"
        );

        resetForm();
        fetchUsers();
      } else {
        setMessage(data.message || "Unable to save user.");
      }
    } catch (error) {
      console.error("Save user error:", error);
      setMessage("Cannot connect to the server.");
    }
  };

  const handleEdit = (user) => {
    setEditId(user.user_id);
    setFullname(user.fullname || "");
    setUsername(user.username || "");
    setPassword("");
    setRole(user.role || "Staff");
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("User deleted successfully!");

        if (editId === id) {
          resetForm();
        }

        fetchUsers();
      } else {
        setMessage(data.message || "Unable to delete user.");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      setMessage("Cannot connect to the server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredUsers = users.filter((user) =>
    `${user.fullname} ${user.username} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalStaff = users.filter(
    (user) => user.role === "Staff"
  ).length;

  const totalAdmins = users.filter(
    (user) => user.role === "Admin"
  ).length;

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds♥.</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>
          <Link to="/products">📦 Products</Link>
          <Link to="/categories">🏷️ Categories</Link>
          <Link to="/customers">👥 Customers</Link>
          <Link to="/orders">🛒 Orders</Link>
          <Link to="/payments">💳 Payments</Link>
          <Link to="/inventory">📥 Inventory</Link>
          <Link to="/reports">📊 Reports</Link>
          <Link to="/users" className="active">👤 Users</Link>
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>User Management</h1>
            <p>Manage your staff accounts and system users.</p>
          </div>

          <div className="admin-info">
            <span>👑</span>
            <div>
              <strong>
                {JSON.parse(localStorage.getItem("user") || "{}").fullname || "Administrator"}
              </strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        {/* WELCOME BANNER */}
        <section className="dashboard-welcome">
          <div>
            <h2>User Management! 💗</h2>
            <p>Add, update, and manage your system accounts.</p>
          </div>

          <span className="welcome-icon">👥</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <p>Total Users</p>
            <h2>{users.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <p>Staff Accounts</p>
            <h2>{totalStaff}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👑</div>
            <p>Admin Accounts</p>
            <h2>{totalAdmins}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🔎</div>
            <p>Search Results</p>
            <h2>{filteredUsers.length}</h2>
          </div>

        </section>

        {/* USER FORM */}
        <section className="module-card">

          <div className="module-heading">
            <div>
              <h2>{editId ? "Update User" : "Add New User"}</h2>
              <p>
                {editId
                  ? "Update the selected account information."
                  : "Create a new staff or administrator account."}
              </p>
            </div>
          </div>

          <form
            className="module-form"
            onSubmit={handleSubmit}
          >

            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>
                Password {editId ? "(Leave blank to keep current password)" : ""}
              </label>
              <input
                type="password"
                placeholder={editId ? "Enter new password" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="pink-button">
                {editId ? "Update User" : "Add User"}
              </button>

              {editId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>

          </form>

          {message && (
            <p className="module-message">{message}</p>
          )}

        </section>

        {/* USERS TABLE */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>User Accounts</h2>
              <p>View and manage registered system users.</p>
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>
                      <td>{user.fullname}</td>
                      <td>{user.username}</td>
                      <td>
                        <span className="reports-status reports-status-completed">
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <button
                          className="edit-button"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDelete(user.user_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </section>

      </main>
    </div>
  );
}

export default Users;
