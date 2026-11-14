
import { useEffect, useState } from "react";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

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

  const filteredCategories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <h1>Categories</h1>
          <p>Organize and manage your product categories.</p>
        </div>
        <div className="module-count">
          {categories.length} Categories
        </div>
      </div>

      {message && <div className="module-message">{message}</div>}

      <div className="module-card">
        <h2>{editId ? "Update Category" : "Add New Category"}</h2>

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
              {editId ? "Update Category" : "Add Category"}
            </button>

            {editId && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEditId(null);
                  setCategoryName("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="module-card">
        <div className="table-heading">
          <h2>Category List</h2>
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
                    <td>{category.category_id}</td>
                    <td>{category.category_name}</td>
                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(category.category_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="empty-table">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Categories;