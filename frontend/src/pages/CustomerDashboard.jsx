
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [placingOrder, setPlacingOrder] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const savedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    if (!token || savedUser.role !== "Customer") {
      navigate("/");
      return;
    }

    setUser(savedUser);
    fetchCustomerData();
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchCustomerData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [productResponse, orderResponse, profileResponse] =
        await Promise.all([
          fetch("http://localhost:5000/api/customer/products", {
            headers
          }),
          fetch("http://localhost:5000/api/customer/orders", {
            headers
          }),
          fetch("http://localhost:5000/api/profile", {
            headers
          })
        ]);

      if (
        productResponse.status === 401 ||
        orderResponse.status === 401
      ) {
        handleLogout();
        return;
      }

      if (productResponse.ok) {
        const productData = await productResponse.json();
        setProducts(productData);
      }

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrders(orderData);
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUser(profileData);
        localStorage.setItem("user", JSON.stringify(profileData));
      }

    } catch (error) {
      console.error("Customer dashboard error:", error);
      showMessage("Unable to connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP"
    });
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showMessage("This product is out of stock.", "error");
      return;
    }

    const existingItem = cart.find(
      item => item.product_id === product.product_id
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showMessage("You have reached the available stock.", "error");
        return;
      }

      setCart(cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          price: Number(product.price),
          stock: Number(product.stock),
          quantity: 1
        }
      ]);
    }

    showMessage("Product added to cart!");
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cart.find(
      product => product.product_id === productId
    );

    if (!item) return;

    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.stock) {
      showMessage("Quantity exceeds available stock.", "error");
      return;
    }

    setCart(cart.map(product =>
      product.product_id === productId
        ? { ...product, quantity: newQuantity }
        : product
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(
      item => item.product_id !== productId
    ));
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const placeOrder = async () => {
    if (cart.length === 0) {
      showMessage("Your cart is empty.", "error");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await fetch(
        "http://localhost:5000/api/customer/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity
            }))
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          data.message || "Unable to place your order.",
          "error"
        );
        return;
      }

      setCart([]);
      showMessage(
        `Order #${data.order_id} placed successfully!`
      );

      await fetchCustomerData();
      setActiveSection("orders");

    } catch (error) {
      console.error("Place order error:", error);
      showMessage("Unable to place your order.", "error");
    } finally {
      setPlacingOrder(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    order => order.status === "Pending"
  ).length;

  const completedOrders = orders.filter(
    order => order.status === "Completed" ||
             order.status === "Paid"
  ).length;

  const renderDashboard = () => (
    <>
      <section className="dashboard-welcome">
        <div>
          <h2>Hello, {user.fullname || "Customer"}! 💗</h2>
          <p>Welcome to Small Business. Start shopping today!</p>
        </div>
        <span className="welcome-icon">🛍️</span>
      </section>

      <section className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon">📦</div>
          <p>Available Products</p>
          <h2>{loading ? "..." : products.length}</h2>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🛒</div>
          <p>Cart Items</p>
          <h2>{cartQuantity}</h2>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📋</div>
          <p>My Orders</p>
          <h2>{loading ? "..." : totalOrders}</h2>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">⏳</div>
          <p>Pending Orders</p>
          <h2>{loading ? "..." : pendingOrders}</h2>
        </div>
      </section>

      <section className="customer-content-card">
        <div className="customer-section-heading">
          <div>
            <h3>Featured Products</h3>
            <p>Browse our available products.</p>
          </div>

          <button
            className="customer-outline-button"
            onClick={() => setActiveSection("products")}
          >
            View All Products
          </button>
        </div>

        <div className="customer-product-grid">
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No products available.</p>
          ) : (
            products.slice(0, 4).map(product => (
              <div className="customer-product-card" key={product.product_id}>
                <div className="customer-product-icon">🛍️</div>

                <h4>{product.product_name}</h4>

                <p>{product.category_name || "General"}</p>

                <strong>{formatPrice(product.price)}</strong>

                <small>Stock: {product.stock}</small>

                <button
                  className="pink-button"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="customer-content-card">
        <div className="customer-section-heading">
          <div>
            <h3>Recent Orders</h3>
            <p>Check your latest orders.</p>
          </div>

          <button
            className="customer-outline-button"
            onClick={() => setActiveSection("orders")}
          >
            View Orders
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="customer-empty">You have no orders yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{order.order_date}</td>
                    <td>{formatPrice(order.total_amount)}</td>
                    <td>
                      <span className={`customer-status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  const renderProducts = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>Shop Products</h3>
          <p>Choose your favorite products.</p>
        </div>
      </div>

      <input
        type="text"
        className="search-input customer-search"
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="customer-empty">No products found.</p>
      ) : (
        <div className="customer-product-grid">
          {filteredProducts.map(product => (
            <div className="customer-product-card" key={product.product_id}>
              <div className="customer-product-icon">📦</div>

              <h4>{product.product_name}</h4>

              <p>{product.category_name || "General"}</p>

              <strong>{formatPrice(product.price)}</strong>

              <small>
                {product.stock > 0
                  ? `Available Stock: ${product.stock}`
                  : "Out of Stock"}
              </small>

              <button
                className="pink-button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderCart = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>My Shopping Cart</h3>
          <p>Review your selected products.</p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="customer-empty">
          <h2>🛒</h2>
          <p>Your shopping cart is empty.</p>

          <button
            className="pink-button"
            onClick={() => setActiveSection("products")}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
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
                {cart.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}</td>
                    <td>{formatPrice(item.price)}</td>

                    <td>
                      <div className="customer-quantity">
                        <button
                          onClick={() => updateQuantity(
                            item.product_id,
                            item.quantity - 1
                          )}
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() => updateQuantity(
                            item.product_id,
                            item.quantity + 1
                          )}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td>
                      {formatPrice(item.price * item.quantity)}
                    </td>

                    <td>
                      <button
                        className="delete-button"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="customer-cart-summary">
            <h3>Order Summary</h3>

            <p>
              Total Items:
              <strong>{cartQuantity}</strong>
            </p>

            <h2>{formatPrice(cartTotal)}</h2>

            <button
              className="pink-button"
              disabled={placingOrder}
              onClick={placeOrder}
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </>
      )}
    </section>
  );

  const renderOrders = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>My Orders</h3>
          <p>View your order history and status.</p>
        </div>

        <button
          className="customer-outline-button"
          onClick={fetchCustomerData}
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="customer-empty">
          <h2>📋</h2>
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="customer-orders-list">
          {orders.map(order => (
            <div className="customer-order-card" key={order.order_id}>
              <div className="customer-order-header">
                <div>
                  <h4>Order #{order.order_id}</h4>
                  <small>{order.order_date}</small>
                </div>

                <span className={`customer-status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <div className="customer-order-items">
                {order.items.map((item, index) => (
                  <p key={`${order.order_id}-${item.product_id}-${index}`}>
                    {item.product_name} × {item.quantity}
                    <strong>{formatPrice(item.subtotal)}</strong>
                  </p>
                ))}
              </div>

              <div className="customer-order-total">
                <span>Total Amount</span>
                <strong>{formatPrice(order.total_amount)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderAccount = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>My Account</h3>
          <p>Your customer account information.</p>
        </div>
      </div>

      <div className="customer-account-info">
        <div className="customer-account-avatar">👤</div>

        <div>
          <h2>{user.fullname || "Customer"}</h2>
          <p>Customer Account</p>
        </div>
      </div>

      <div className="customer-account-details">
        <p>
          <strong>Full Name:</strong>
          {user.fullname}
        </p>

        <p>
          <strong>Username:</strong>
          {user.username}
        </p>

        <p>
          <strong>Role:</strong>
          {user.role}
        </p>

        <p>
          <strong>Status:</strong>
          Active
        </p>
      </div>
    </section>
  );

  const sectionTitles = {
    dashboard: "Dashboard",
    products: "Shop Products",
    cart: "My Cart",
    orders: "My Orders",
    account: "My Account"
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <h2>Small Business Management.</h2>

        <nav>
          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            🏠 Dashboard
          </button>

          <button
            className={activeSection === "products" ? "active" : ""}
            onClick={() => setActiveSection("products")}
          >
            📦 Shop Products
          </button>

          <button
            className={activeSection === "cart" ? "active" : ""}
            onClick={() => setActiveSection("cart")}
          >
            🛒 My Cart ({cartQuantity})
          </button>

          <button
            className={activeSection === "orders" ? "active" : ""}
            onClick={() => setActiveSection("orders")}
          >
            📋 My Orders
          </button>

          <button
            className={activeSection === "account" ? "active" : ""}
            onClick={() => setActiveSection("account")}
          >
            👤 My Account
          </button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{sectionTitles[activeSection]}</h1>
            <p>Welcome to your customer account!</p>
          </div>

          <div className="admin-info">
            <span>👤</span>
            <div>
              <strong>{user.fullname || "Customer"}</strong>
              <small>Customer</small>
            </div>
          </div>
        </header>

        {message && (
          <div className={`customer-message ${messageType}`}>
            <span>{message}</span>
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {activeSection === "dashboard" && renderDashboard()}
        {activeSection === "products" && renderProducts()}
        {activeSection === "cart" && renderCart()}
        {activeSection === "orders" && renderOrders()}
        {activeSection === "account" && renderAccount()}
      </main>
    </div>
  );
}

export default CustomerDashboard;
