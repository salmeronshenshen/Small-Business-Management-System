
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Orders() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [amountPaid, setAmountPaid] = useState("");

  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD CUSTOMERS, PRODUCTS AND ORDERS
  const loadData = async () => {
    try {
      const [customerRes, productRes, orderRes] = await Promise.all([
        fetch("http://localhost:5000/api/customers", { headers }),
        fetch("http://localhost:5000/api/products", { headers }),
        fetch("http://localhost:5000/api/orders", { headers })
      ]);

      if (!customerRes.ok || !productRes.ok || !orderRes.ok) {
        throw new Error("Failed to load order information.");
      }

      const customerData = await customerRes.json();
      const productData = await productRes.json();
      const orderData = await orderRes.json();

      setCustomers(customerData);
      setProducts(productData);
      setOrders(orderData);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // GET PRODUCT STOCK
  const getStock = (product) => {
    return Number(product.stock ?? product.stock_quantity ?? 0);
  };

  // GET CUSTOMER NAME
  const getCustomerName = (customer) => {
    return customer.customer_name || customer.fullname || "Unknown Customer";
  };

  // ADD PRODUCT TO CART
  const addToCart = () => {
    const selectedProduct = products.find(
      (product) => product.product_id === Number(productId)
    );

    if (!selectedProduct) {
      setMessage("Please select a product.");
      return;
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      setMessage("Enter a valid quantity.");
      return;
    }

    const existingItem = cart.find(
      (item) => item.product_id === selectedProduct.product_id
    );

    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + Number(quantity);

    if (newQuantity > getStock(selectedProduct)) {
      setMessage("Not enough stock available.");
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === selectedProduct.product_id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.product_name,
          price: Number(selectedProduct.price),
          quantity: Number(quantity)
        }
      ]);
    }

    setProductId("");
    setQuantity(1);
    setMessage("Product added to cart.");
  };

  // REMOVE PRODUCT FROM CART
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.product_id !== id));
  };

  // TOTAL AMOUNT
  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const changeAmount = Number(amountPaid) - totalAmount;

  // PROCESS NEW ADMIN ORDER
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerId) {
      setMessage("Please select a customer.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Please add products to your cart.");
      return;
    }

    if (amountPaid === "" || Number(amountPaid) < totalAmount) {
      setMessage("Payment is not enough.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer_id: Number(customerId),
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity
          })),
          amount_paid: Number(amountPaid)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process order.");
      }

      setMessage("Order successfully processed!");

      setCustomerId("");
      setProductId("");
      setQuantity(1);
      setAmountPaid("");
      setCart([]);

      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // ORDER SUMMARY
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
      🛒 Orders
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
    <p>Manage customer orders and transactions.</p>
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
              Create customer orders, manage shopping carts,
              and monitor your sales transactions.
            </p>
          </div>

          <span className="welcome-icon">🛒</span>
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

        {/* CREATE ORDER */}
        <section className="module-card">
          <div className="module-heading">
            <div>
              <h2>🛒 Create New Order</h2>
              <p>Fill in the details to create a customer order.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="module-form">

              <div className="form-field">
                <label>Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">Choose Customer</option>

                  {customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {getCustomerName(customer)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Select Product</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Choose Product</option>

                  {products.map((product) => (
                    <option
                      key={product.product_id}
                      value={product.product_id}
                      disabled={getStock(product) <= 0}
                    >
                      {product.product_name} - ₱
                      {Number(product.price).toFixed(2)}
                      {" "}(Stock: {getStock(product)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Action</label>
                <button
                  type="button"
                  className="pink-button"
                  onClick={addToCart}
                >
                  + Add to Cart
                </button>
              </div>

            </div>

            {/* SHOPPING CART */}
            <div style={{ marginTop: "25px" }}>
              <div className="table-heading">
                <div>
                  <h2>🛍️ Shopping Cart</h2>
                  <p>Review the products before processing the order.</p>
                </div>

                <strong>{cart.length} Items</strong>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cart.length > 0 ? (
                      cart.map((item) => (
                        <tr key={item.product_id}>
                          <td>{item.product_name}</td>
                          <td>₱{item.price.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          Your shopping cart is empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAYMENT DETAILS */}
            <div style={{ marginTop: "25px" }}>
              <div className="table-heading">
                <div>
                  <h2>💳 Payment Details</h2>
                  <p>Enter the customer's payment information.</p>
                </div>
              </div>

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
                  <label>Amount Paid (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Change</label>
                  <input
                    type="text"
                    value={
                      amountPaid === ""
                        ? "₱0.00"
                        : `₱${Math.max(0, changeAmount).toFixed(2)}`
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="orders-total-box">
                <span>Order Total</span>
                <strong>₱{totalAmount.toFixed(2)}</strong>
              </div>

              <button type="submit" className="pink-button">
                ✓ Process Order
              </button>
            </div>
          </form>

          {message && (
            <div className="module-message">
              {message}
            </div>
          )}
        </section>

        {/* ORDER HISTORY */}
        <section className="module-card">
          <div className="table-heading">
            <div>
              <h2>📋 Order History</h2>
              <p>
                View and search all recorded customer orders,
                including orders from the Customer Dashboard.
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
