
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalSales: 0
  });

  const [loading, setLoading] = useState(true);

  const isAdmin = user.role === "Admin";
  const isStaff = user.role === "Staff";

  useEffect(() => {
    fetchDashboard();
  }, []);

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

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        <h2>Beauty Finds♥.</h2>

        <nav>
          <Link to="/dashboard" className="active">
            🏠 Dashboard
          </Link>

          <Link to="/products">📦 Products</Link>

          {/* ADMIN ONLY */}
          {isAdmin && (
            <>
              <Link to="/categories">🏷️ Categories</Link>
              <Link to="/customers">👥 Customers</Link>
            </>
          )}

          <Link to="/orders">🛒 Orders</Link>
          <Link to="/payments">💳 Payments</Link>

          {/* ADMIN ONLY */}
          {isAdmin && (
            <>
              <Link to="/inventory">📥 Inventory</Link>
              <Link to="/reports">📊 Reports</Link>
              <Link to="/users">👤 Users</Link>
            </>
          )}
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
            <h1>Dashboard</h1>
            <p>Welcome to your business overview!</p>
          </div>

          <div className="admin-info">
            <span>
              {isAdmin ? "👑" : "👤"}
            </span>

            <div>
              <strong>
                {user.fullname || "User"}
              </strong>

              <small>
                {user.role || "Account"}
              </small>
            </div>

          </div>

        </header>

        {/* WELCOME */}
        <section className="dashboard-welcome">

          <div>
            <h2>
              Hello, {user.fullname || "User"}! 💗
            </h2>

            <p>
              Here's what's happening in your business today.
            </p>
          </div>

          <span className="welcome-icon">💼</span>

        </section>

        {/* DASHBOARD CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">📦</div>

            <p>Total Products</p>

            <h2>
              {loading ? "..." : stats.totalProducts}
            </h2>
          </div>

          {/* ADMIN ONLY */}
          {isAdmin && (
            <div className="dashboard-card">
              <div className="card-icon">👥</div>

              <p>Total Customers</p>

              <h2>
                {loading ? "..." : stats.totalCustomers}
              </h2>
            </div>
          )}

          <div className="dashboard-card">
            <div className="card-icon">🛒</div>

            <p>Total Orders</p>

            <h2>
              {loading ? "..." : stats.totalOrders}
            </h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💰</div>

            <p>Total Sales</p>

            <h2>
              {loading
                ? "..."
                : `₱${Number(stats.totalSales).toLocaleString(
                    "en-PH",
                    {
                      minimumFractionDigits: 2
                    }
                  )}`}
            </h2>
          </div>

        </section>

        {/* BOTTOM SECTION */}
        <section className="dashboard-bottom">

          <div className="dashboard-info-card">

            <h3>Quick Access</h3>

            <p>
              Manage your business using these modules.
            </p>

            <div className="quick-links">

              <Link to="/products">
                Manage Products
              </Link>

              {/* ADMIN ONLY */}
              {isAdmin && (
                <Link to="/customers">
                  Manage Customers
                </Link>
              )}

              <Link to="/orders">
                View Orders
              </Link>

              <Link to="/payments">
                View Payments
              </Link>

              {/* ADMIN ONLY */}
              {isAdmin && (
                <Link to="/reports">
                  View Reports
                </Link>
              )}

            </div>

          </div>

          <div className="dashboard-info-card">

            <h3>Account Information</h3>

            <p>
              <strong>Name:</strong> {user.fullname}
            </p>

            <p>
              <strong>Username:</strong> {user.username}
            </p>

            <p>
              <strong>Role:</strong> {user.role}
            </p>

            <p>
              <strong>Status:</strong> Active
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
