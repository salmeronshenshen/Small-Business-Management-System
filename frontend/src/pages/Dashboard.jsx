
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalSales: 0
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSummary(data);
        } else {
          setMessage(data.message || "Unable to load dashboard.");
        }
      } catch (error) {
        setMessage("Cannot connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">♡</div>
          <div>
            <h2>PinkBiz</h2>
            <span>Management System</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="sidebar-menu">
          <div className="menu-item active">
            <span>▦</span> Dashboard
          </div>

          <div className="menu-item">
            <span>▣</span> Categories
          </div>

          <div className="menu-item">
            <span>📦</span> Products
          </div>

          <div className="menu-item">
            <span>♙</span> Customers
          </div>

          <div className="menu-item">
            <span>🛒</span> Orders / Sales
          </div>

          <div className="menu-item">
            <span>💳</span> Payments
          </div>

          <div className="menu-item">
            <span>▤</span> Inventory
          </div>

          <div className="menu-item">
            <span>▧</span> Reports
          </div>

          <div className="menu-item">
            <span>⚙</span> Users
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-box">
            <div className="profile-avatar">
              {user.fullname
                ? user.fullname.charAt(0).toUpperCase()
                : "U"}
            </div>

            <div className="profile-info">
              <strong>{user.fullname || "User"}</strong>
              <span>{user.role || "Staff"}</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your business overview.</p>
          </div>

          <div className="header-user">
            <span className="notification-icon">♡</span>
            <div>
              <strong>{user.fullname || "User"}</strong>
              <span>{user.role || "Staff"}</span>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <span className="welcome-tag">YOUR BUSINESS AT A GLANCE</span>
            <h2>Hello, {user.fullname || "there"}! ♡</h2>
            <p>Manage your business easily in one place.</p>
          </div>

          <div className="welcome-decoration">♡</div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Business Overview</h2>
              <p>Here's what's happening in your business.</p>
            </div>
          </div>

          {message && (
            <div className="dashboard-message">{message}</div>
          )}

          {loading ? (
            <p className="loading-text">Loading dashboard...</p>
          ) : (
            <div className="summary-grid">

              <div className="summary-card">
                <div className="summary-icon pink">▣</div>
                <p>Total Products</p>
                <h3>{summary.totalProducts}</h3>
                <span>Products registered</span>
              </div>

              <div className="summary-card">
                <div className="summary-icon purple">♙</div>
                <p>Total Customers</p>
                <h3>{summary.totalCustomers}</h3>
                <span>Registered customers</span>
              </div>

              <div className="summary-card">
                <div className="summary-icon peach">🛒</div>
                <p>Total Orders</p>
                <h3>{summary.totalOrders}</h3>
                <span>Recorded orders</span>
              </div>

              <div className="summary-card">
                <div className="summary-icon rose">₱</div>
                <p>Total Sales</p>
                <h3>
                  ₱{Number(summary.totalSales).toLocaleString(
                    "en-PH",
                    { minimumFractionDigits: 2 }
                  )}
                </h3>
                <span>Total paid sales</span>
              </div>

            </div>
          )}
        </section>

        <section className="dashboard-bottom">
          <div className="overview-panel">
            <h2>Business Management</h2>
            <p>
              Keep track of your products, customers, orders,
              payments and inventory in one convenient system.
            </p>

            <div className="overview-decoration">
              <span>♡</span>
              <strong>Organize. Manage. Grow.</strong>
            </div>
          </div>

          <div className="quick-panel">
            <h2>Quick Summary</h2>

            <div className="quick-row">
              <span>Products</span>
              <strong>{summary.totalProducts}</strong>
            </div>

            <div className="quick-row">
              <span>Customers</span>
              <strong>{summary.totalCustomers}</strong>
            </div>

            <div className="quick-row">
              <span>Orders</span>
              <strong>{summary.totalOrders}</strong>
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          © 2026 PinkBiz Management System. All rights reserved.
        </footer>

      </main>
    </div>
  );
}

export default Dashboard;