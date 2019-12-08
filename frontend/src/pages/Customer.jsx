
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    customer_name: "",
    contact_number: "",
    address: ""
  });

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // LOAD CUSTOMERS
  const loadCustomers = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/customers",
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to load customers.");
      }

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ADD OR UPDATE CUSTOMER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.customer_name.trim()) {
      setMessage("Customer name is required.");
      return;
    }

    try {
      const url = editId
        ? `http://localhost:5000/api/customers/${editId}`
        : "http://localhost:5000/api/customers";

      const response = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          customer_name: form.customer_name.trim(),
          contact_number: form.contact_number.trim(),
          address: form.address.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save customer.");
      }

      setMessage(
        editId
          ? "Customer updated successfully!"
          : "Customer added successfully!"
      );

      handleCancel();
      loadCustomers();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // EDIT CUSTOMER
  const handleEdit = (customer) => {
    setForm({
      customer_name: customer.customer_name,
      contact_number: customer.contact_number || "",
      address: customer.address || ""
    });

    setEditId(customer.customer_id);
    setMessage("");
  };

  // DELETE CUSTOMER
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/customers/${id}`,
        {
          method: "DELETE",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete customer.");
      }

      setMessage("Customer deleted successfully!");
      loadCustomers();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // CLEAR FORM
  const handleCancel = () => {
    setForm({
      customer_name: "",
      contact_number: "",
      address: ""
    });

    setEditId(null);
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // SEARCH CUSTOMERS
  const filteredCustomers = customers.filter((customer) =>
    customer.customer_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <h2>Beauty Finds♥.</h2>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>
          <Link to="/products">📦 Products</Link>
          <Link to="/categories">🏷️ Categories</Link>
          <Link to="/customers" className="active">👥 Customers</Link>
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
            <h1>Customers</h1>
            <p>Manage your business customer information.</p>
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
            <h2>Customer Management! 💗</h2>
            <p>
              Keep track of your customers and manage their
              information easily in one place.
            </p>
          </div>

          <span className="welcome-icon">👥</span>
        </section>

        {/* SUMMARY CARDS */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <p>Total Customers</p>
            <h2>{customers.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🔎</div>
            <p>Search Results</p>
            <h2>{filteredCustomers.length}</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">✨</div>
            <p>Customer Status</p>
            <h2>Active</h2>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <p>Customer Records</p>
            <h2>{customers.length}</h2>
          </div>

        </section>

        {/* CUSTOMER FORM */}
        <section className="module-card">

          <div className="module-heading">
            <div>
              <h2>
                {editId ? "✏️ Update Customer" : "＋ Add New Customer"}
              </h2>

              <p>
                {editId
                  ? "Update the selected customer information."
                  : "Enter the information of your new customer."}
              </p>
            </div>
          </div>

          {message && (
            <div className="module-message">
              {message}
            </div>
          )}

          <form className="module-form" onSubmit={handleSubmit}>

            <div className="form-field">
              <label>Customer Name</label>
              <input
                type="text"
                name="customer_name"
                placeholder="Enter customer name"
                value={form.customer_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Contact Number</label>
              <input
                type="text"
                name="contact_number"
                placeholder="Enter contact number"
                value={form.contact_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Address</label>
              <input
                type="text"
                name="address"
                placeholder="Enter customer address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="pink-button">
                {editId ? "Update Customer" : "+ Add Customer"}
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

        {/* CUSTOMER TABLE */}
        <section className="module-card">

          <div className="table-heading">
            <div>
              <h2>👥 Customer List</h2>
              <p>View, search, edit, and delete customer records.</p>
            </div>

            <input
              className="search-input"
              type="text"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="data-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Contact Number</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td>#{customer.customer_id}</td>

                      <td>
                        <strong>{customer.customer_name}</strong>
                      </td>

                      <td>{customer.contact_number || "—"}</td>

                      <td>{customer.address || "—"}</td>

                      <td>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => handleEdit(customer)}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleDelete(customer.customer_id)
                            }
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No customers found.
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

export default Customers;
