
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/categories",
        { headers }
      );

      const data = await response.json();

      if (response.ok) {
        setCategories(data);
      } else {
        setMessage(data.message || "Unable to load categories.");
      }
    } catch {
      setMessage("Cannot connect to server.");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!categoryName.trim()) {
      setMessage("Please enter a category name.");
      return;
    }

    try {
      const url = editId
        ? `http://localhost:5000/api/categories/${editId}`
        : "http://localhost:5000/api/categories";

      const response = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          category_name: categoryName.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCategoryName("");
        setEditId(null);
        loadCategories();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("Cannot connect to server.");
    }
  };

  const handleEdit = (category) => {
    setCategoryName(category.category_name);
    setEditId(category.category_id);
    setMessage("");
  };

  const handleCancel = () => {
    setEditId(null);
    setCategoryName("");
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${id}`,
        {
          method: "DELETE",
          headers
        }
      );

      const data = await response.json();
      setMessage(data.message);
      loadCategories();
    } catch {
      setMessage("Cannot connect to server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredCategories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds♥.</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>
          <Link to="/products">📦 Products</Link>
          <Link to="/categories" className="active">🏷️ Categories</Link>
          <Link to="/customers">👥 Customers</Link>
          <Link to="/orders">🛒 Orders</Link>
          <Link to="/payments">💳 Payments</Link>
          <Link to="/inventory">📥 Inventory</Link>
          <Link to="/reports">📊 Reports</Link>
          <Link to="/users">👤 Users</Link>
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
            <h1>Categories</h1>
            <p>Manage and organize your product categories.</p>
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
            <h2>Category Management! 💗</h2>
            <p>
              Organize your products by managing all your categories
              in one convenient place.
            </p>
          </div>

          <span className="welcome-icon">🏷️</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">🏷️</div>
            <p>Total Categories</p>
            <h2>{categories.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🔎</div>
            <p>Search Results</p>
            <h2>{filteredCategories.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">✨</div>
            <p>Category Status</p>
            <h2>Active</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📁</div>
            <p>Management</p>
            <h2>Ready</h2>
          </div>

        </section>

        {/* CATEGORY FORM */}
        <section className="module-card">
          <div className="module-heading">
            <div>
              <h2>{editId ? "✏️ Update Category" : "＋ Add New Category"}</h2>
              <p>
                {editId
                  ? "Update the selected category name."
                  : "Create a new category for your products."}
              </p>
            </div>
          </div>

          {message && (
            <div className="module-message">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="module-form">
            <div className="form-field">
              <label>Category Name</label>
              <input
                type="text"
                placeholder="Example: Food, Drinks, Supplies"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="pink-button">
                {editId ? "Update Category" : "+ Add Category"}
              </button>

              {editId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* CATEGORY TABLE */}
        <section className="module-card">
          <div className="table-heading">
            <div>
              <h2>🏷️ Category List</h2>
              <p>View, search, edit, and delete your categories.</p>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <tr key={category.category_id}>
                      <td>#{category.category_id}</td>

                      <td>
                        <strong>{category.category_name}</strong>
                      </td>

                      <td>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => handleEdit(category)}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDelete(category.category_id)}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center" }}>
                      No categories found.
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

export default Categories;
