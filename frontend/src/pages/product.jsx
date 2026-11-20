
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// PRODUCT IMAGES
const productImages = {
  "Lip Tint": "/images/products/lip-tint.jpg",
  "Lip Gloss": "/images/products/lip-gloss.jpg",
  "Mini Shoulder Bag": "/images/products/mini-bag.jpg",
  "Tote Bag": "/images/products/tote-bag.jpg",
  "Ribbon Hairclip": "/images/products/ribbon-hairclip.jpg",
  "Pearl Hairclip": "/images/products/pearl-hairclip.jpg",
  "Casual Crop Top": "/images/products/crop-top.jpg",
  "Basic T-Shirt": "/images/products/tshirt.jpg",
  "Denim Jacket": "/images/products/denim-jacket.jpg",
  "Casual Jacket": "/images/products/casual-jacket.jpg",
  "Wide Leg Pants": "/images/products/wide-leg-pants.jpg",
  "Cargo Pants": "/images/products/cargo-pants.jpg",
  "Blush On": "/images/products/blush-on.jpg",
  "Face Powder": "/images/products/face-powder.jpg",
  "Flat Sandals": "/images/products/flat-sandals.jpg",
  "Casual Sandals": "/images/products/casual-sandals.jpg"
};

const getProductImage = (productName) => {
  return productImages[productName] || "/images/products/no-image.jpg";
};

function Products() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
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

  const token = localStorage.getItem("token");

  const isAdmin = user.role === "Admin";
  const isStaff = user.role === "Staff";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD USER INFORMATION
  useEffect(() => {
    loadData(user);
  }, []);

  // LOAD PRODUCTS
  const loadData = async (currentUser = user) => {
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

      // CATEGORIES ARE NEEDED ONLY BY ADMIN
      if (currentUser.role === "Admin") {
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

  // ADD OR UPDATE PRODUCT - ADMIN ONLY
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
      setMessage(
        "Enter a valid price and whole-number stock quantity."
      );
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
      loadData(user);

    } catch (error) {
      setMessage(error.message);
    }
  };

  // EDIT PRODUCT - ADMIN ONLY
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

  // DELETE PRODUCT - ADMIN ONLY
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
      loadData(user);

    } catch (error) {
      setMessage(error.message);
    }
  };

  // CANCEL EDITING
  const handleCancel = () => {
    if (!isAdmin) return;

    setForm({
      product_name: "",
      category_id: "",
      price: "",
      stock_quantity: ""
    });

    setEditId(null);
    setMessage("");
  };

  // SEARCH PRODUCT
  const filteredProducts = products.filter((product) =>
    product.product_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Small Business Management.</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>
          <Link to="/products" className="active">
            📦 Products
          </Link>

           {/* ADMIN ONLY */}
  {isAdmin && (
    <>
      <Link to="/categories">🏷️ Categories</Link>
      <Link to="/customers">👥 Customers</Link>
    </>
  )}

   {/* ADMIN AND STAFF */}
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
            <h1>Product Management</h1>
            <p>
              {isAdmin
                ? "Manage your business products and stock."
                : "View your business products and stock."}
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

        {/* WELCOME SECTION */}
        <section className="products-welcome">
          <div>
            <h2>
              {isAdmin
                ? "Manage Your Products 💗"
                : "View Products 💗"}
            </h2>

            <p>
              {isAdmin
                ? "Add, update, and organize your business products in one place."
                : "View product information, prices, categories, and stock availability."}
            </p>
          </div>

          <span>🛍️</span>
        </section>

        {/* PRODUCT SUMMARY */}
        <section className="products-summary">

          <div className="products-summary-card">
            <div className="products-summary-icon">📦</div>
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
            <div className="products-summary-icon">📥</div>
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

        {/* ADD PRODUCT FORM - ADMIN ONLY */}
        {isAdmin && (
          <section className="products-card">

            <div className="products-card-heading">
              <div>
                <h2>
                  {editId
                    ? "✏️ Update Product"
                    : "✨ Add New Product"}
                </h2>

                <p>
                  {editId
                    ? "Update the information of your product."
                    : "Fill in the details to add a new product."}
                </p>
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
                  placeholder="Enter product name"
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
                  placeholder="Enter product price"
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

        {/* STAFF MESSAGE */}
        {isStaff && message && (
          <div className="products-message">
            {message}
          </div>
        )}

        {/* PRODUCT LIST */}
        <section className="products-card">

          <div className="products-list-heading">
            <div>
              <h2>📋 Product List</h2>
              <p>
                {isAdmin
                  ? "View and manage all your available products."
                  : "View all available product information."}
              </p>
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
                  <th>Image</th>
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
                        <img
                          src={getProductImage(product.product_name)}
                          alt={product.product_name}
                          className="product-list-image"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/images/products/no-image.jpg";
                          }}
                        />
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
                              className="products-edit-button"
                              onClick={() => handleEdit(product)}
                            >
                              Edit
                            </button>

                            <button
                              className="products-delete-button"
                              onClick={() =>
                                handleDelete(product.product_id)
                              }
                            >
                              Delete
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
                      🛍️ No products found.
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

      </main>
    </div>
  );
}

export default Products;
