
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Orders() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD CUSTOMERS AND ORDERS
  const loadData = async () => {
    try {
      const [customerRes, orderRes] = await Promise.all([
        fetch("http://localhost:5000/api/customers", { headers }),
        fetch("http://localhost:5000/api/orders", { headers })
      ]);

      if (!customerRes.ok || !orderRes.ok) {
        throw new Error("Failed to load order information.");
      }

      const customerData = await customerRes.json();
      const orderData = await orderRes.json();

      setCustomers(customerData);
      setOrders(orderData);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  // LOAD DATA WHEN PAGE OPENS
  useEffect(() => {
    loadData();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // SUMMARY
  const pendingOrders = orders.filter((order) => {
    const status = order.order_status || order.status || "Pending";
    return status.toLowerCase() === "pending";
  }).length;

  const completedOrders = orders.filter((order) => {
    const status = order.order_status || order.status || "";

    return (
      status.toLowerCase() === "completed" ||
      status.toLowerCase() === "paid"
    );
  }).length;

  // SEARCH ORDERS
  const filteredOrders = orders.filter((order) => {
    const customer = order.customer_name || order.fullname || "";
    const status = order.order_status || order.status || "";

    return (
      String(order.order_id).includes(search) ||
      customer.toLowerCase().includes(search.toLowerCase()) ||
      status.toLowerCase().includes(search.toLowerCase())
    );
  });

  // SELECTED ORDER
  const selectedOrder = orders.find(
    (order) => String(order.order_id) === String(selectedOrderId)
  );

  // PAYMENT DETAILS
  const totalAmount = Number(selectedOrder?.total_amount || 0);

  const amountPaid = Number(
    selectedOrder?.amount_paid ||
    selectedOrder?.paid_amount ||
    selectedOrder?.payment_amount ||
    selectedOrder?.cash ||
    0
  );

  const changeAmount = Number(
    selectedOrder?.change_amount ??
    selectedOrder?.change ??
    Math.max(0, amountPaid - totalAmount)
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Small Business Management.</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>

          <Link to="/products">📦 Products</Link>

          {/* ADMIN ONLY */}
          {user.role === "Admin" && (
            <>
              <Link to="/categories">🏷️ Categories</Link>
              <Link to="/customers">👥 Customers</Link>
            </>
          )}

          <Link to="/orders" className="active">
            📋 Orders
          </Link>

          <Link to="/payments">💳 Payments</Link>

          {/* ADMIN ONLY */}
          {user.role === "Admin" && (
            <>
              <Link to="/inventory">📥 Inventory</Link>
              <Link to="/reports">📊 Reports</Link>
              <Link to="/users">👤 Users</Link>
            </>
          )}
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
            <h1>Orders</h1>
            <p>View and monitor customer orders.</p>
          </div>

          <div className="admin-info">
            <span>
              {user.role === "Admin" ? "👑" : "👤"}
            </span>

            <div>
              <strong>{user.fullname || "User"}</strong>
              <small>{user.role || "Account"}</small>
            </div>
          </div>
        </header>

        {/* WELCOME BANNER */}
        <section className="dashboard-welcome">
          <div>
            <h2>Order Management! 💗</h2>
            <p>
              View and monitor customer orders and sales transactions.
            </p>
          </div>

          <span className="welcome-icon">📋</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">🛍️</div>
            <p>Total Orders</p>
            <h2>{orders.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⏳</div>
            <p>Pending Orders</p>
            <h2>{pendingOrders}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">✅</div>
            <p>Completed Orders</p>
            <h2>{completedOrders}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <p>Total Customers</p>
            <h2>{customers.length}</h2>
          </div>

        </section>

        {/* PAYMENT DETAILS */}
        <section className="module-card">

          <div className="module-heading">
            <div>
              <h2>💳 Payment Details</h2>
              <p>
                Select an existing order to view its payment information.
              </p>
            </div>
          </div>

          {/* SELECT ORDER */}
          <div className="module-form">

            <div className="form-field">
              <label>Select Order</label>

              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">Choose Order</option>

                {orders.map((order) => (
                  <option
                    key={order.order_id}
                    value={order.order_id}
                  >
                    Order #{order.order_id} -{" "}
                    {order.customer_name || order.fullname || "Customer"}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* PAYMENT INFORMATION */}
          {selectedOrder ? (
            <>
              <div className="module-form">

                <div className="form-field">
                  <label>Total Amount</label>

                  <input
                    type="text"
                    value={`₱${totalAmount.toFixed(2)}`}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Amount Paid</label>

                  <input
                    type="text"
                    value={`₱${amountPaid.toFixed(2)}`}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Change</label>

                  <input
                    type="text"
                    value={`₱${changeAmount.toFixed(2)}`}
                    readOnly
                  />
                </div>

              </div>

              <div className="orders-total-box">
                <span>Order Total</span>
                <strong>₱{totalAmount.toFixed(2)}</strong>
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", padding: "20px" }}>
              Please select an order to view payment details.
            </p>
          )}

        </section>

        {/* ORDER HISTORY */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>📋 Order History</h2>
              <p>
                View and search all recorded customer orders.
              </p>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="Search order ID, customer, or status..."
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
                    const status =
                      order.order_status || order.status || "Pending";

                    const isCompleted =
                      status.toLowerCase() === "paid" ||
                      status.toLowerCase() === "completed";

                    return (
                      <tr key={order.order_id}>
                        <td>#{order.order_id}</td>

                        <td>
                          {order.customer_name ||
                            order.fullname ||
                            "Unknown Customer"}
                        </td>

                        <td>
                          ₱{Number(order.total_amount || 0).toFixed(2)}
                        </td>

                        <td>{order.order_date}</td>

                        <td>
                          <span
                            className={`orders-status ${
                              isCompleted
                                ? "orders-status-completed"
                                : "orders-status-pending"
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
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </section>

      </main>
    </div>
  );
}

export default Orders;
