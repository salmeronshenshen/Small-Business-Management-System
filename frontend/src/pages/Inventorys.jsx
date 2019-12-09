
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Inventory() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [movementType, setMovementType] = useState("Stock In");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD PRODUCTS
  const loadData = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/products",
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to load products.");
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : []
      );

    } catch (error) {
      console.error("Products Error:", error);
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

  // TOTAL STOCK
  const totalStock = products.reduce(
    (total, product) =>
      total + Number(
        product.stock_quantity ?? product.stock ?? 0
      ),
    0
  );

  // LOW STOCK
  const lowStock = products.filter(
    (product) =>
      Number(
        product.stock_quantity ?? product.stock ?? 0
      ) <= 10
  ).length;

  // SELECTED PRODUCT
  const selectedProduct = products.find(
    (product) =>
      Number(product.product_id) === Number(productId)
  );

  // RECORD STOCK MOVEMENT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!productId) {
      setMessage("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      setMessage("Please enter a valid quantity.");
      return;
    }

    const currentStock = Number(
      selectedProduct?.stock_quantity ??
      selectedProduct?.stock ??
      0
    );

    if (
      movementType === "Stock Out" &&
      Number(quantity) > currentStock
    ) {
      setMessage("Not enough stock available.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/inventory",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            product_id: Number(productId),
            quantity: Number(quantity),
            movement_type: movementType,
            remarks
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update inventory."
        );
      }

      setMessage(
        data.message || "Inventory updated successfully!"
      );

      setProductId("");
      setQuantity(1);
      setMovementType("Stock In");
      setRemarks("");

      await loadData();

    } catch (error) {
      console.error("Inventory Update Error:", error);
      setMessage(error.message);
    }
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds♥.</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>

          <Link to="/products">📦 Products</Link>

          {user.role === "Admin" && (
            <>
              <Link to="/categories">🏷️ Categories</Link>
              <Link to="/customers">👥 Customers</Link>
            </>
          )}

          <Link to="/orders">📋 Orders</Link>

          <Link to="/payments">💳 Payments</Link>

          {user.role === "Admin" && (
            <>
              <Link to="/inventory" className="active">
                📥 Inventory
              </Link>

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
            <h1>Inventory</h1>
            <p>
              Monitor product stocks and inventory movements.
            </p>
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
            <h2>Inventory Management! 💗</h2>

            <p>
              Keep track of your product stocks, record stock
              movements, and monitor your available inventory.
            </p>
          </div>

          <span className="welcome-icon">📦</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">📦</div>
            <p>Total Products</p>
            <h2>{products.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <p>Total Stock</p>
            <h2>{totalStock}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚠️</div>
            <p>Low Stock</p>
            <h2>{lowStock}</h2>
          </div>

        </section>

        {/* STOCK MOVEMENT FORM */}
        <section className="module-card">

          <div className="module-heading">
            <div>
              <h2>📥 Update Inventory</h2>
              <p>Record stock in or stock out movements.</p>
            </div>
          </div>

          {message && (
            <div className="module-message">
              {message}
            </div>
          )}

          <form
            className="module-form"
            onSubmit={handleSubmit}
          >

            {/* PRODUCT */}
            <div className="form-field">
              <label>Select Product</label>

              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                <option value="">Choose Product</option>

                {products.map((product) => {
                  const stock = Number(
                    product.stock_quantity ?? product.stock ?? 0
                  );

                  return (
                    <option
                      key={product.product_id}
                      value={product.product_id}
                    >
                      {product.product_name} - Current Stock: {stock}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* MOVEMENT TYPE */}
            <div className="form-field">
              <label>Movement Type</label>

              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
              >
                <option value="Stock In">Stock In</option>
                <option value="Stock Out">Stock Out</option>
              </select>
            </div>

            {/* QUANTITY */}
            <div className="form-field">
              <label>Quantity</label>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* REMARKS */}
            <div className="form-field">
              <label>Remarks</label>

              <input
                type="text"
                placeholder="Enter remarks (optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="pink-button"
              >
                ✓ Save Inventory Movement
              </button>
            </div>

          </form>
        </section>

        {/* CURRENT STOCK OVERVIEW */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>📦 Current Stock Overview</h2>
              <p>View the available quantity of each product.</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">

              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                </tr>
              </thead>

              <tbody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const stock = Number(
                      product.stock_quantity ?? product.stock ?? 0
                    );

                    return (
                      <tr key={product.product_id}>
                        <td>#{product.product_id}</td>

                        <td>{product.product_name}</td>

                        <td>{stock}</td>

                        <td>
                          {stock <= 10 ? (
                            <span className="inventory-status-low">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inventory-status-available">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center" }}
                    >
                      No products available.
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

export default Inventory;
