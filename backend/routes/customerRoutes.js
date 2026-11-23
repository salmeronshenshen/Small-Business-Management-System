
const express = require("express");

module.exports = (database) => {
  const router = express.Router();

  // GET ALL CUSTOMERS
  router.get("/", (req, res) => {
    try {
      const customers = database.prepare(`
        SELECT *
        FROM customers
        ORDER BY customer_id DESC
      `).all();

      res.json(customers);
    } catch (error) {
      res.status(500).json({
        message: "Unable to load customers."
      });
    }
  });

  // ADD CUSTOMER
  router.post("/", (req, res) => {
    try {
      const { customer_name, contact_number, address } = req.body;

      if (
        !customer_name ||
        !customer_name.trim() ||
        !contact_number ||
        !contact_number.trim() ||
        !address ||
        !address.trim()
      ) {
        return res.status(400).json({
          message: "Please complete all customer information."
        });
      }

      const result = database.prepare(`
        INSERT INTO customers (
          customer_name,
          contact_number,
          address
        )
        VALUES (?, ?, ?)
      `).run(
        customer_name.trim(),
        contact_number.trim(),
        address.trim()
      );

      res.status(201).json({
        message: "Customer added successfully!",
        customer_id: result.lastInsertRowid
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to add customer."
      });
    }
  });

  // UPDATE CUSTOMER
  router.put("/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { customer_name, contact_number, address } = req.body;

      if (
        !customer_name ||
        !customer_name.trim() ||
        !contact_number ||
        !contact_number.trim() ||
        !address ||
        !address.trim()
      ) {
        return res.status(400).json({
          message: "Please complete all customer information."
        });
      }

      const result = database.prepare(`
        UPDATE customers
        SET
          customer_name = ?,
          contact_number = ?,
          address = ?
        WHERE customer_id = ?
      `).run(
        customer_name.trim(),
        contact_number.trim(),
        address.trim(),
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Customer not found."
        });
      }

      res.json({
        message: "Customer updated successfully!"
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to update customer."
      });
    }
  });

  // DELETE CUSTOMER
  router.delete("/:id", (req, res) => {
    try {
      const { id } = req.params;

      // CHECK IF CUSTOMER HAS ORDERS
      const existingOrders = database.prepare(`
        SELECT COUNT(*) AS total
        FROM orders
        WHERE customer_id = ?
      `).get(id);

      // PREVENT DELETING CUSTOMER WITH ORDERS
      if (existingOrders.total > 0) {
        return res.status(400).json({
          message: "Cannot delete this customer because they have existing orders."
        });
      }

      // DELETE CUSTOMER IF NO ORDERS
      const result = database.prepare(`
        DELETE FROM customers
        WHERE customer_id = ?
      `).run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Customer not found."
        });
      }

      res.json({
        message: "Customer deleted successfully!"
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Unable to delete customer."
      });
    }
  });

  return router;
};
