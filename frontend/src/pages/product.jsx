
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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

// CHECK IF PRODUCT CAN HAVE SHADES
const canHaveShades = (product) => {
  const name = product.product_name.toLowerCase();
  const category = (product.category_name || "").toLowerCase();

  return (
    category === "lip products" ||
    category === "face makeup" ||
    name.includes("lip tint") ||
    name.includes("lip gloss") ||
    name.includes("lipstick") ||
    name.includes("lippie") ||
    name.includes("blush") ||
    name.includes("foundation") ||
    name.includes("concealer")
  );
};

function Products() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    product_name: "",
    category_id: "",
    price: "",
    stock_quantity: ""
  });

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // SHADE STATES
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shades, setShades] = useState([]);
  const [shadeName, setShadeName] = useState("");

  const token = localStorage.getItem("token");

  const role = String(user.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD DATA
  useEffect(() => {
    loadData();
  }, []);

  // LOAD PRODUCTS AND CATEGORIES
  const loadData = async () => {
    try {
      const productResponse = await fetch(
        "http://localhost:5000/api/products",
        { headers }
      );

      if (!productResponse.ok) {
        throw new Error("Failed to load products.");
      }

      const productData = await productResponse.json();
      setProducts(productData);

      if (isAdmin) {
        const categoryResponse = await fetch(
          "http://localhost:5000/api/categories",
          { headers }
        );

        if (!categoryResponse.ok) {
          throw new Error("Failed to load categories.");
        }

        const categoryData = await categoryResponse.json();
        setCategories(categoryData);
      }

    } catch (error) {
      setMessage(error.message);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // INPUT CHANGES
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ADD OR UPDATE PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setMessage("Admin access only.");
      return;
    }

    if (
      !form.product_name.trim() ||
      !form.category_id ||
      form.price === "" ||
      form.stock_quantity === ""
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    if (
      Number(form.price) < 0 ||
      Number(form.stock_quantity) < 0 ||
      !Number.isInteger(Number(form.stock_quantity))
    ) {
      setMessage("Enter a valid price and whole-number stock quantity.");
      return;
    }

    try {
      const url = editId
        ? `http://localhost:5000/api/products/${editId}`
        : "http://localhost:5000/api/products";

      const response = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save product.");
      }

      setMessage(
        editId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      setForm({
        product_name: "",
        category_id: "",
        price: "",
        stock_quantity: ""
      });

      setEditId(null);
      await loadData();

    } catch (error) {
      setMessage(error.message);
    }
  };

  // EDIT PRODUCT
  const handleEdit = (product) => {
    if (!isAdmin) return;

    setForm({
      product_name: product.product_name,
      category_id: String(product.category_id),
      price: String(product.price),
      stock_quantity: String(product.stock_quantity)
    });

    setEditId(product.product_id);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // DELETE PRODUCT
  const handleDelete = async (id) => {
    if (!isAdmin) return;

    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${id}`,
        {
          method: "DELETE",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete product.");
      }

      setMessage("Product deleted successfully!");
      await loadData();

    } catch (error) {
      setMessage(error.message);
    }
  };

  // CANCEL EDITING
  const handleCancel = () => {
    setForm({
      product_name: "",
      category_id: "",
      price: "",
      stock_quantity: ""
    });

    setEditId(null);
    setMessage("");
  };

  // OPEN SHADE MANAGEMENT
  const handleOpenShades = async (product) => {
    if (!canHaveShades(product)) {
      return;
    }
  
    setSelectedProduct(product);
    setShades([]);
    setShadeName("");
    setMessage("");                                                                                                                                                                                                                                                                                                                                                                                       

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${product.product_id}/shades`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load shades.");
      }

      setShades(data);

    } catch (error) {
      setMessage(error.message);
    }
  };

  // ADD SHADE
  const handleAddShade = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !shadeName.trim()) {
      setMessage("Please enter a shade name.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${selectedProduct.product_id}/shades`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            shade_name: shadeName.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add shade.");
      }

      setShadeName("");
      setMessage("Shade added successfully!");

      await handleOpenShades(selectedProduct);

    } catch (error) {
      setMessage(error.message);
    }
  };

  // DELETE SHADE
  const handleDeleteShade = async (shadeId) => {
    if (!selectedProduct) return;

    if (!window.confirm("Are you sure you want to delete this shade?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${selectedProduct.product_id}/shades/${shadeId}`,
        {
          method: "DELETE",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete shade.");
      }

      setMessage("Shade deleted successfully!");
      await handleOpenShades(selectedProduct);

    } catch (error) {
      setMessage(error.message);
    }
  };

  // SEARCH PRODUCTS
  const filteredProducts = products.filter((product) =>
    product.product_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds♥</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>

          <Link to="/products" className="active">
            💄 Products
          </Link>

          {isAdmin && (
            <>
              <Link to="/categories">🏷️ Categories</Link>
              <Link to="/customers">👥 Customers</Link>
            </>
          )}

          <Link to="/orders">🛒 Orders</Link>
          <Link to="/payments">💳 Payments</Link>

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
            <h1>Product Management</h1>
            <p>
              {isAdmin
                ? "Manage your Beauty Finds products and shades."
                : "View Beauty Finds products and stock."}
            </p>
          </div>

          <div className="admin-info">
            <span>{isAdmin ? "👑" : "👤"}</span>
            <div>
              <strong>{user.fullname || "User"}</strong>
              <small>{user.role || "Account"}</small>
            </div>
          </div>
        </header>

        {/* WELCOME */}
        <section className="products-welcome">
          <div>
            <h2>
              {isAdmin
                ? "Manage Your Beauty Products 💗"
                : "Explore Beauty Products 💗"}
            </h2>

            <p>
              {isAdmin
                ? "Add, update, and organize your beauty products and shades."
                : "View available beauty products, prices, and stock."}
            </p>
          </div>

          <span>💄</span>
        </section>

        {/* SUMMARY */}
        <section className="products-summary">

          <div className="products-summary-card">
            <div className="products-summary-icon">💄</div>
            <div>
              <p>Total Products</p>
              <h2>{products.length}</h2>
            </div>
          </div>

          {isAdmin && (
            <div className="products-summary-card">
              <div className="products-summary-icon">🏷️</div>
              <div>
                <p>Total Categories</p>
                <h2>{categories.length}</h2>
              </div>
            </div>
          )}

          <div className="products-summary-card">
            <div className="products-summary-icon">📦</div>
            <div>
              <p>Total Stock</p>
              <h2>
                {products.reduce(
                  (total, product) =>
                    total + Number(product.stock_quantity || 0),
                  0
                )}
              </h2>
            </div>
          </div>

        </section>

        {/* ADD PRODUCT FORM */}
        {isAdmin && (
          <section className="products-card">

            <div className="products-card-heading">
              <div>
                <h2>
                  {editId ? "✏️ Update Product" : "✨ Add Beauty Product"}
                </h2>

                <p>Enter the product details below.</p>
              </div>

              <span>💗</span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="products-form"
            >

              <div className="products-form-field">
                <label>Product Name</label>

                <input
                  type="text"
                  name="product_name"
                  placeholder="Example: Lip Tint"
                  value={form.product_name}
                  onChange={handleChange}
                />
              </div>

              <div className="products-form-field">
                <label>Category</label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="products-form-field">
                <label>Price (₱)</label>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div className="products-form-field">
                <label>Stock Quantity</label>

                <input
                  type="number"
                  name="stock_quantity"
                  min="0"
                  step="1"
                  placeholder="Enter stock quantity"
                  value={form.stock_quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="products-form-actions">

                <button
                  type="submit"
                  className="products-submit-button"
                >
                  {editId ? "✓ Update Product" : "+ Add Product"}
                </button>

                {editId && (
                  <button
                    type="button"
                    className="products-cancel-button"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

            {message && (
              <div className="products-message">
                {message}
              </div>
            )}

          </section>
        )}

        {/* PRODUCT LIST */}
        <section className="products-card">

          <div className="products-list-heading">
            <div>
              <h2>📋 Beauty Product List</h2>
              <p>View and manage your beauty products.</p>
            </div>

            <input
              className="products-search"
              type="text"
              placeholder="🔍 Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="products-table-wrapper">

            <table className="products-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sticker</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>

                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.product_id}>

                      <td>#{product.product_id}</td>

                      <td>
                        <span className="product-sticker">
                          {getProductSticker(product.product_name)}
                        </span>
                      </td>

                      <td className="products-name">
                        {product.product_name}
                      </td>

                      <td>
                        {product.category_name || "Uncategorized"}
                      </td>

                      <td>
                        ₱{Number(product.price).toFixed(2)}
                      </td>

                      <td>
                        <span className="products-stock">
                          {product.stock_quantity}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="products-action-buttons">

                            <button
                              type="button"
                              className="products-edit-button"
                              onClick={() => handleEdit(product)}
                            >
                              ✏️ Edit
                            </button>

                            {canHaveShades(product) && (
  <button
    type="button"
    className="products-shade-button"
    onClick={() => handleOpenShades(product)}
  >
    🎨 Shades
  </button>
)}

                            <button
                              type="button"
                              className="products-delete-button"
                              onClick={() =>
                                handleDelete(product.product_id)
                              }
                            >
                              🗑️ Delete
                            </button>

                          </div>
                        </td>
                      )}

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="products-empty"
                    >
                      💄 No products found.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>

          </div>

          <p className="products-table-footer">
            Showing {filteredProducts.length} of {products.length} products
          </p>

        </section>

        {/* SHADE MANAGEMENT */}
        {isAdmin && selectedProduct && (
          <section className="products-card">

            <div className="products-card-heading">
              <div>
                <h2>🎨 Product Shades</h2>

                <p>
                  Managing shades for:{" "}
                  <strong>{selectedProduct.product_name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="products-cancel-button"
                onClick={() => {
                  setSelectedProduct(null);
                  setShades([]);
                  setShadeName("");
                  setMessage("");
                }}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleAddShade}
              className="products-form"
            >

              <div className="products-form-field">
                <label>New Shade Name</label>

                <input
                  type="text"
                  placeholder="Example: Cherry Red"
                  value={shadeName}
                  onChange={(e) => setShadeName(e.target.value)}
                />
              </div>

              <div className="products-form-actions">
                <button
                  type="submit"
                  className="products-submit-button"
                >
                  + Add Shade
                </button>
              </div>

            </form>

            {message && (
              <div className="products-message">
                {message}
              </div>
            )}

            <div className="products-shade-list">

              <h3>Available Shades</h3>

              {shades.length > 0 ? (
                shades.map((shade) => (
                  <div
                    key={shade.shade_id}
                    className="products-shade-item"
                  >
                    <span>🎨 {shade.shade_name}</span>

                    <button
                      type="button"
                      className="products-delete-button"
                      onClick={() => handleDeleteShade(shade.shade_id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p>No shades added for this product yet.</p>
              )}

            </div>

          </section>
        )}

        {/* GENERAL MESSAGE */}
        {!isAdmin && message && (
          <div className="products-message">
            {message}
          </div>
        )}

      </main>
    </div>
  );
}

export default Products;
