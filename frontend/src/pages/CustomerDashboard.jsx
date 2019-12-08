
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// PRODUCT STICKERS
const getProductSticker = (productName) => {
  const name = productName.toLowerCase();

  if (
    name.includes("lip") ||
    name.includes("tint") ||
    name.includes("gloss") ||
    name.includes("lipstick")
  ) return "💄";

  if (
    name.includes("blush") ||
    name.includes("powder") ||
    name.includes("foundation") ||
    name.includes("concealer") ||
    name.includes("highlighter")
  ) return "✨";

  if (
    name.includes("cleanser") ||
    name.includes("toner") ||
    name.includes("serum") ||
    name.includes("moisturizer") ||
    name.includes("sunscreen")
  ) return "🧴";

  if (
    name.includes("mascara") ||
    name.includes("eyeliner") ||
    name.includes("eyeshadow") ||
    name.includes("eyebrow") ||
    name.includes("eyelash")
  ) return "👁️";

  if (
    name.includes("lotion") ||
    name.includes("scrub") ||
    name.includes("body") ||
    name.includes("mist")
  ) return "🌸";

  if (
    name.includes("brush") ||
    name.includes("blender") ||
    name.includes("puff") ||
    name.includes("mirror") ||
    name.includes("pouch") ||
    name.includes("hairclip")
  ) return "🎀";

  return "💗";
};

// CHECK IF PRODUCT NEEDS SHADES
const canHaveShades = (product) => {
  const name = String(product.product_name || "").toLowerCase();
  const category = String(product.category_name || "").toLowerCase();

  return (
    category === "lip products" ||
    category === "face makeup" ||
    name.includes("lip") ||
    name.includes("lippie") ||
    name.includes("blush") ||
    name.includes("foundation") ||
    name.includes("concealer")
  );
};

function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedShades, setSelectedShades] = useState({});
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

    if (
      !token ||
      String(savedUser.role || "").toLowerCase() !== "customer"
    ) {
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

      const [
        productResponse,
        orderResponse,
        profileResponse
      ] = await Promise.all([
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
      } else {
        throw new Error("Unable to load products.");
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
      showMessage(error.message || "Unable to connect to the server.", "error");
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

  // SELECT PRODUCT SHADE
  const handleShadeChange = (productId, shade) => {
    setSelectedShades(previous => ({
      ...previous,
      [productId]: shade
    }));
  };

  // ADD PRODUCT TO CART
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showMessage("This product is out of stock.", "error");
      return;
    }

    const productShades = product.shades || [];

const hasShadeOptions =
  canHaveShades(product) && productShades.length > 0;

const selectedShade = hasShadeOptions
  ? selectedShades[product.product_id] || ""
  : "";

if (hasShadeOptions && !selectedShade) {
  showMessage("Please select a product shade first.", "error");
  return;
}

const shadeValue = selectedShade || null;

    const existingItem = cart.find(
      item =>
        item.product_id === product.product_id &&
        item.shade === shadeValue
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showMessage("You have reached the available stock.", "error");
        return;
      }

      setCart(previous =>
        previous.map(item =>
          item.product_id === product.product_id &&
          item.shade === shadeValue
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );

    } else {
      setCart(previous => [
        ...previous,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          price: Number(product.price),
          stock: Number(product.stock),
          shade: shadeValue,
          quantity: 1
        }
      ]);
    }

    showMessage("Product added to cart!");
  };

  // UPDATE CART QUANTITY
  const updateQuantity = (productId, shade, newQuantity) => {
    const item = cart.find(
      product =>
        product.product_id === productId &&
        product.shade === shade
    );

    if (!item) return;

    if (newQuantity < 1) {
      removeFromCart(productId, shade);
      return;
    }

    if (newQuantity > item.stock) {
      showMessage("Quantity exceeds available stock.", "error");
      return;
    }

    setCart(previous =>
      previous.map(product =>
        product.product_id === productId &&
        product.shade === shade
          ? { ...product, quantity: newQuantity }
          : product
      )
    );
  };

  // REMOVE CART ITEM
  const removeFromCart = (productId, shade) => {
    setCart(previous =>
      previous.filter(
        item =>
          !(
            item.product_id === productId &&
            item.shade === shade
          )
      )
    );
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // PLACE CUSTOMER ORDER
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
              quantity: item.quantity,
              shade: item.shade
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
      setSelectedShades({});

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

  // SEARCH PRODUCTS
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
    order =>
      order.status === "Completed" ||
      order.status === "Paid"
  ).length;

  // PRODUCT CARD
  const renderProductCard = (product) => {
    const productShades = product.shades || [];
  
    const hasShadeOptions =
      canHaveShades(product) && productShades.length > 0;
  
    return (
      <div
        className="customer-product-card"
        key={product.product_id}
      >
        <div className="customer-product-icon">
          {getProductSticker(product.product_name)}
        </div>

        <h4>{product.product_name}</h4>

        <p>{product.category_name || "Beauty Product"}</p>

        <strong>{formatPrice(product.price)}</strong>

        <small>
          {product.stock > 0
            ? `Available Stock: ${product.stock}`
            : "Out of Stock"}
        </small>

        {hasShadeOptions && (
          <div className="customer-shade-selection">
            <label htmlFor={`shade-${product.product_id}`}>
              🎨 Select Shade:
            </label>

            <select
              id={`shade-${product.product_id}`}
              value={selectedShades[product.product_id] || ""}
              onChange={e =>
                handleShadeChange(
                  product.product_id,
                  e.target.value
                )
              }
            >
              <option value="">Choose a shade</option>

              {productShades.map(shade => (
                <option
                  key={shade.shade_id}
                  value={shade.shade_name}
                >
                  {shade.shade_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className="pink-button"
          disabled={product.stock <= 0}
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    );
  };

  // DASHBOARD
  const renderDashboard = () => (
    <>
      <section className="dashboard-welcome">
        <div>
          <h2>Hello, {user.fullname || "Customer"}! 💗</h2>
          <p>Welcome to Beauty Finds. Start shopping today!</p>
        </div>

        <span className="welcome-icon">🛍️</span>
      </section>

      <section className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon">💄</div>
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
            <h3>Featured Beauty Products</h3>
            <p>Browse our available beauty products.</p>
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
            products.slice(0, 4).map(product =>
              renderProductCard(product)
            )
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
          <p className="customer-empty">
            You have no orders yet.
          </p>
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
                      <span
                        className={`customer-status ${String(order.status || "").toLowerCase()}`}
                      >
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

  // SHOP PRODUCTS
  const renderProducts = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>Shop Beauty Products</h3>
          <p>Choose your favorite beauty products.</p>
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
        <p className="customer-empty">
          No products found.
        </p>
      ) : (
        <div className="customer-product-grid">
          {filteredProducts.map(product =>
            renderProductCard(product)
          )}
        </div>
      )}
    </section>
  );

  // SHOPPING CART
  const renderCart = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>My Shopping Cart</h3>
          <p>Review your selected products and shades.</p>
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
                  <th>Shade</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {cart.map(item => (
                  <tr
                    key={`${item.product_id}-${item.shade || "none"}`}
                  >
                    <td>{item.product_name}</td>
                    <td>{item.shade || "N/A"}</td>
                    <td>{formatPrice(item.price)}</td>

                    <td>
                      <div className="customer-quantity">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product_id,
                              item.shade,
                              item.quantity - 1
                            )
                          }
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product_id,
                              item.shade,
                              item.quantity + 1
                            )
                          }
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
                        onClick={() =>
                          removeFromCart(
                            item.product_id,
                            item.shade
                          )
                        }
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

  // CUSTOMER ORDER HISTORY
  const renderOrders = () => (
    <section className="customer-content-card">
      <div className="customer-section-heading">
        <div>
          <h3>My Orders</h3>
          <p>View your order history and selected shades.</p>
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
            <div
              className="customer-order-card"
              key={order.order_id}
            >
              <div className="customer-order-header">
                <div>
                  <h4>Order #{order.order_id}</h4>
                  <small>{order.order_date}</small>
                </div>

                <span
                  className={`customer-status ${String(order.status || "").toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="customer-order-items">
                {order.items.map((item, index) => (
                  <p
                    key={`${order.order_id}-${item.product_id}-${index}`}
                  >
                    <span>
                      {item.product_name} × {item.quantity}

                      {item.shade && (
                        <small>
                          {" "} | Shade: {item.shade}
                        </small>
                      )}
                    </span>

                    <strong>
                      {formatPrice(item.subtotal)}
                    </strong>
                  </p>
                ))}
              </div>

              <div className="customer-order-total">
                <span>Total Amount</span>
                <strong>
                  {formatPrice(order.total_amount)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // CUSTOMER ACCOUNT
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

  // MAIN LAYOUT
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds</h2>

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
            💄 Shop Products
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

        <button
          className="logout-button"
          onClick={handleLogout}
        >
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

            <button onClick={() => setMessage("")}>
              ×
            </button>
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