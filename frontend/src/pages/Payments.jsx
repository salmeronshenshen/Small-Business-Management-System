
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    order_id: "",
    amount_paid: "",
    payment_method: "Cash"
  });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD PAYMENT RECORDS
  const loadPayments = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/payments",
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load payments.");
      }

      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  // LOAD UNPAID ORDERS
  const loadOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/payments/orders",
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load orders.");
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadPayments();
    loadOrders();
  }, []);

  // SELECTED ORDER
  const selectedOrder = orders.find(
    (order) => String(order.order_id) === String(form.order_id)
  );

  const remainingBalance = selectedOrder
    ? Math.max(
        0,
        Number(selectedOrder.total_amount) -
        Number(selectedOrder.amount_paid_so_far || 0)
      )
    : 0;

  const changeAmount = selectedOrder
    ? Math.max(0, Number(form.amount_paid || 0) - remainingBalance)
    : 0;

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // CLEAR FORM
  const handleCancel = () => {
    setForm({
      order_id: "",
      amount_paid: "",
      payment_method: "Cash"
    });
  };

  // RECORD PAYMENT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.order_id) {
      setMessage("Please select an order.");
      return;
    }

    const amount = Number(form.amount_paid);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Please enter a valid payment amount.");
      return;
    }

    if (!selectedOrder) {
      setMessage("Selected order was not found.");
      return;
    }

    if (amount < remainingBalance) {
      setMessage("Payment must cover the remaining balance.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/payments",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            order_id: Number(form.order_id),
            amount_paid: amount,
            payment_method: form.payment_method
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to record payment.");
      }

      setMessage(data.message || "Payment recorded successfully!");

      handleCancel();

      await Promise.all([
        loadPayments(),
        loadOrders()
      ]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // SEARCH PAYMENTS
  const filteredPayments = payments.filter((payment) => {
    const customerName = payment.customer_name || "";
    const method = payment.payment_method || "";

    return (
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      String(payment.order_id).includes(search) ||
      method.toLowerCase().includes(search.toLowerCase())
    );
  });

  // TOTAL COLLECTED
  const totalCollected = payments.reduce(
    (total, payment) => total + Number(payment.amount_paid || 0),
    0
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds♥.</h2>

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

  {/* ADMIN AND STAFF */}
  <Link to="/orders">🛒 Orders</Link>

  <Link to="/payments" className="active">
    💳 Payments
  </Link>

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
            <h1>Payments</h1>
            <p>Manage customer payments and transactions.</p>
          </div>
          <div className="admin-info">
  <span>{user.role === "Admin" ? "👑" : "👤"}</span>

  <div>
    <strong>{user.fullname || "User"}</strong>
    <small>{user.role || "Account"}</small>
  </div>
</div>
        </header>

        {/* WELCOME BANNER */}
        <section className="dashboard-welcome">
          <div>
            <h2>Payment Management! 💗</h2>
            <p>
              Record customer payments, monitor collections,
              and manage your business transactions.
            </p>
          </div>

          <span className="welcome-icon">💳</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <p>Total Collected</p>
            <h2>
              ₱{totalCollected.toLocaleString("en-PH", {
                minimumFractionDigits: 2
              })}
            </h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🧾</div>
            <p>Total Transactions</p>
            <h2>{payments.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <p>Unpaid Orders</p>
            <h2>{orders.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🔎</div>
            <p>Search Results</p>
            <h2>{filteredPayments.length}</h2>
          </div>

        </section>

        {/* PAYMENT FORM */}
        <section className="module-card">

          <div className="module-heading">
            <div>
              <h2>💳 Record New Payment</h2>
              <p>Choose an order and enter the customer's payment.</p>
            </div>
          </div>

          {message && (
            <div className="module-message">
              {message}
            </div>
          )}

          <form className="module-form" onSubmit={handleSubmit}>

            <div className="form-field">
              <label>Select Customer Order</label>

              <select
                name="order_id"
                value={form.order_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Select an order --</option>

                {orders.map((order) => (
                  <option key={order.order_id} value={order.order_id}>
                    Order #{order.order_id} - {order.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrder && (
              <section className="dashboard-cards">

                <div className="dashboard-card">
                  <div className="card-icon">🧾</div>
                  <p>Order Total</p>
                  <h2>
                    ₱{Number(selectedOrder.total_amount).toLocaleString(
                      "en-PH",
                      { minimumFractionDigits: 2 }
                    )}
                  </h2>
                </div>

                <div className="dashboard-card">
                  <div className="card-icon">💵</div>
                  <p>Remaining Balance</p>
                  <h2>
                    ₱{remainingBalance.toLocaleString("en-PH", {
                      minimumFractionDigits: 2
                    })}
                  </h2>
                </div>

              </section>
            )}

            <div className="form-field">
              <label>Amount Paid (₱)</label>
              <input
                type="number"
                name="amount_paid"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                value={form.amount_paid}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Payment Method</label>
              <select
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {selectedOrder && form.amount_paid && (
              <div className="module-message">
                <strong>Change: </strong>
                ₱{changeAmount.toLocaleString("en-PH", {
                  minimumFractionDigits: 2
                })}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="pink-button"
                disabled={loading}
              >
                {loading ? "Recording..." : "💳 Record Payment"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
              >
                Clear
              </button>
            </div>

          </form>
        </section>

        {/* PAYMENT RECORDS */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>♡ Payment Records</h2>
              <p>View all recorded customer payments.</p>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="🔎 Search payment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">

              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount Paid</th>
                  <th>Change</th>
                  <th>Method</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td>#{payment.payment_id}</td>
                      <td>#{payment.order_id}</td>
                      <td>{payment.customer_name || "—"}</td>

                      <td>
                        ₱{Number(payment.amount_paid || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>

                      <td>
                        ₱{Number(payment.change_amount || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>

                      <td>{payment.payment_method || "—"}</td>

                      <td>
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      No payment records found. ♡
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

export default Payments;
