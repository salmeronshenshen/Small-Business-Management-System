
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Reports() {
  const navigate = useNavigate();

  const [report, setReport] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    monthlySales: [],
    topProducts: [],
    recentOrders: []
  });

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD REPORTS
  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/reports",
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load reports.");
      }

      setReport({
        totalSales: Number(data.totalSales || 0),
        totalOrders: Number(data.totalOrders || 0),
        totalCustomers: Number(data.totalCustomers || 0),
        totalProducts: Number(data.totalProducts || 0),
        monthlySales: data.monthlySales || [],
        topProducts: data.topProducts || [],
        recentOrders: data.recentOrders || []
      });

      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // FORMAT CURRENCY
  const formatCurrency = (amount) => {
    return `₱${Number(amount || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // SEARCH RECENT ORDERS
  const filteredOrders = report.recentOrders.filter((order) => {
    const customer = order.customer_name || "";
    const status = order.order_status || "";

    return (
      String(order.order_id).includes(search) ||
      customer.toLowerCase().includes(search.toLowerCase()) ||
      status.toLowerCase().includes(search.toLowerCase())
    );
  });

  // MONTHLY SALES BAR HEIGHT
  const highestSales = Math.max(
    ...report.monthlySales.map((item) => Number(item.total_sales)),
    1
  );

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
          <Link to="/reports" className="active">📊 Reports</Link>
          <Link to="/users">👤 Users</Link>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>Reports</h1>
            <p>View your business performance and sales records.</p>
          </div>

          <div className="admin-info">
            <span>👑</span>
            <div>
              <strong>{user.fullname || "Administrator"}</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        {/* WELCOME BANNER */}
        <section className="dashboard-welcome">
          <div>
            <h2>Business Overview! 💗</h2>
            <p>
              Monitor your sales, orders, customers, and product
              performance in one place.
            </p>
          </div>

          <span className="welcome-icon">📊</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <p>Total Sales</p>
            <h2>{formatCurrency(report.totalSales)}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🛒</div>
            <p>Total Orders</p>
            <h2>{report.totalOrders}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <p>Total Customers</p>
            <h2>{report.totalCustomers}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📦</div>
            <p>Total Products</p>
            <h2>{report.totalProducts}</h2>
          </div>

        </section>

        {/* ERROR MESSAGE */}
        {message && (
          <div className="module-message">
            {message}
            <button
              type="button"
              className="pink-button"
              onClick={loadReports}
            >
              Try Again
            </button>
          </div>
        )}

        {/* MONTHLY SALES */}
        <section className="module-card">

          <div className="module-heading">
            <div>
              <h2>📈 Monthly Sales Overview</h2>
              <p>Sales performance for the recent months.</p>
            </div>

            <button
              type="button"
              className="pink-button"
              onClick={loadReports}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="module-message">
              Loading sales report...
            </div>
          ) : report.monthlySales.length > 0 ? (
            <div className="reports-chart">
              {report.monthlySales.map((item, index) => {
                const sales = Number(item.total_sales || 0);

                const barHeight = Math.max(
                  (sales / highestSales) * 100,
                  5
                );

                return (
                  <div className="reports-chart-item" key={index}>
                    <strong>{formatCurrency(sales)}</strong>

                    <div className="reports-bar-area">
                      <div
                        className="reports-bar"
                        style={{ height: `${barHeight}%` }}
                        title={formatCurrency(sales)}
                      />
                    </div>

                    <span>{item.month}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="module-message">
              No sales records available yet.
            </div>
          )}

        </section>

        {/* TOP SELLING PRODUCTS */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>🏆 Top Selling Products</h2>
              <p>Products ranked by total quantity sold.</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">

              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product Name</th>
                  <th>Quantity Sold</th>
                  <th>Total Sales</th>
                </tr>
              </thead>

              <tbody>
                {report.topProducts.length > 0 ? (
                  report.topProducts.map((product, index) => (
                    <tr key={product.product_id}>
                      <td>#{index + 1}</td>
                      <td>{product.product_name}</td>
                      <td>{product.quantity_sold}</td>
                      <td>
                        {formatCurrency(product.total_sales)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      No product sales available.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </section>

        {/* RECENT ORDERS */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>📋 Recent Orders</h2>
              <p>Latest customer order transactions.</p>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="🔎 Search order ID, customer, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">

              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Order Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const status = order.order_status || "Pending";

                    return (
                      <tr key={order.order_id}>
                        <td>#{order.order_id}</td>
                        <td>{order.customer_name}</td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td>{order.order_date}</td>
                        <td>
                          <span
                            className={`reports-status ${
                              status.toLowerCase() === "paid" ||
                              status.toLowerCase() === "completed"
                                ? "reports-status-completed"
                                : "reports-status-pending"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5">
                      No order records found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </section>

        <footer>
          Made with ♡ | Small Business Management System
        </footer>

      </main>
    </div>
  );
}

export default Reports;