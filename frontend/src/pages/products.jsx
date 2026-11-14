
import { useEffect, useState } from "react";

function Products() {
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

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // Load products and categories
  const loadData = async () => {
    try {
      const productResponse = await fetch(
        "http://localhost:5000/api/products",
        { headers }
      );

      const categoryResponse = await fetch(
        "http://localhost:5000/api/categories",
        { headers }
      );

      if (!productResponse.ok || !categoryResponse.ok) {
        throw new Error("Failed to load data.");
      }

      const productData = await productResponse.json();
      const categoryData = await categoryResponse.json();

      setProducts(productData);
      setCategories(categoryData);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Input changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Add or update product
  const handleSubmit = async (e) => {
    e.preventDefault();

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

      setMessage(editId ? "Product updated successfully!" : "Product added successfully!");

      setForm({
        product_name: "",
        category_id: "",
        price: "",
        stock_quantity: ""
      });

      setEditId(null);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setForm({
      product_name: product.product_name,
      category_id: String(product.category_id),
      price: String(product.price),
      stock_quantity: String(product.stock_quantity)
    });

    setEditId(product.product_id);
    setMessage("");
  };

  // Delete product
  const handleDelete = async (id) => {
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
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Cancel editing
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

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="module-page">
      <div className="module-heading">
        <div>
          <h1>Product Management</h1>
          <p>Manage your business products and stock.</p>
        </div>
      </div>

      <div className="module-card">
        <h2>{editId ? "Update Product" : "Add New Product"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Product Name</label>
            <input
              type="text"
              name="product_name"
              placeholder="Enter product name"
              value={form.product_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
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

          <div className="form-field">
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

          <div className="form-field">
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

          <div className="form-actions">
            <button type="submit" className="pink-button">
              {editId ? "Update Product" : "Add Product"}
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

        {message && <p className="module-message">{message}</p>}
      </div>

      <div className="module-card">
        <div className="table-heading">
          <h2>Product List</h2>

          <input
            className="search-input"
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>{product.product_name}</td>
                    <td>{product.category_name || "Uncategorized"}</td>
                    <td>₱{Number(product.price).toFixed(2)}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(product.product_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-table">
                    No products found.
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

export default Products;
