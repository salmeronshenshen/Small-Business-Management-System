
import { useEffect, useState } from "react";

function Customers() {
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

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // Load customers
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

  // Handle input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Add or update customer
  const handleSubmit = async (e) => {
    e.preventDefault();

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

  // Edit customer
  const handleEdit = (customer) => {
    setForm({
      customer_name: customer.customer_name,
      contact_number: customer.contact_number || "",
      address: customer.address || ""
    });

    setEditId(customer.customer_id);
    setMessage("");
  };

  // Delete customer
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

  // Clear form
  const handleCancel = () => {
    setForm({
      customer_name: "",
      contact_number: "",
      address: ""
    });

    setEditId(null);
  };

  // Search customers
  const filteredCustomers = customers.filter((customer) =>
    customer.customer_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="module-page">

      <div className="module-heading">
        <div>
          <h1>Customer Management</h1>
          <p>Manage your business customer information.</p>
        </div>
      </div>

      <div className="module-card">
        <h2>{editId ? "Update Customer" : "Add New Customer"}</h2>

        <form className="module-form" onSubmit={handleSubmit}>

          <div className="form-field">
            <label>Customer Name</label>
            <input
              type="text"
              name="customer_name"
              placeholder="Enter customer name"
              value={form.customer_name}
              onChange={handleChange}
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
              {editId ? "Update Customer" : "Add Customer"}
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

        {message && (
          <p className="module-message">{message}</p>
        )}
      </div>

      <div className="module-card">

        <div className="table-heading">
          <h2>Customer List</h2>

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
                    <td>{customer.customer_id}</td>
                    <td>{customer.customer_name}</td>
                    <td>{customer.contact_number}</td>
                    <td>{customer.address}</td>
                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDelete(customer.customer_id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table">
                    No customers found.
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

export default Customers;
