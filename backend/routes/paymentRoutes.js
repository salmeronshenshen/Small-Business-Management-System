
const express = require("express");

module.exports = (database) => {
  const router = express.Router();

  // GET ALL PAYMENTS
  router.get("/", (req, res) => {
    try {
      const payments = database.prepare(`
        SELECT
          payments.payment_id,
          payments.order_id,
          payments.amount_paid,
          payments.change_amount,
          payments.payment_method,
          payments.payment_date,
          customers.customer_name
        FROM payments
        JOIN orders
          ON payments.order_id = orders.order_id
        JOIN customers
          ON orders.customer_id = customers.customer_id
        ORDER BY payments.payment_id DESC
      `).all();

      res.json(payments);
    } catch (error) {
      res.status(500).json({
        message: "Unable to load payments."
      });
    }
  });

  // GET ORDERS WITH REMAINING BALANCE
  router.get("/orders", (req, res) => {
    try {
      const orders = database.prepare(`
        SELECT
          orders.order_id,
          orders.customer_id,
          orders.total_amount,
          customers.customer_name,
          COALESCE(SUM(payments.amount_paid), 0) AS amount_paid_so_far
        FROM orders
        JOIN customers
          ON orders.customer_id = customers.customer_id
        LEFT JOIN payments
          ON orders.order_id = payments.order_id
        GROUP BY
          orders.order_id,
          orders.customer_id,
          orders.total_amount,
          customers.customer_name
        HAVING
          orders.total_amount > COALESCE(SUM(payments.amount_paid), 0)
        ORDER BY orders.order_id DESC
      `).all();

      res.json(orders);
    } catch (error) {
      res.status(500).json({
        message: "Unable to load unpaid orders."
      });
    }
  });

  // RECORD PAYMENT
  router.post("/", (req, res) => {
    try {
      const { order_id, amount_paid, payment_method } = req.body;

      if (!order_id || !amount_paid || Number(amount_paid) <= 0) {
        return res.status(400).json({
          message: "Please provide a valid order and payment amount."
        });
      }

      const order = database.prepare(`
        SELECT
          orders.order_id,
          orders.total_amount,
          COALESCE(SUM(payments.amount_paid), 0) AS amount_paid_so_far
        FROM orders
        LEFT JOIN payments
          ON orders.order_id = payments.order_id
        WHERE orders.order_id = ?
        GROUP BY orders.order_id
      `).get(order_id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found."
        });
      }

      const remainingBalance =
        Number(order.total_amount) - Number(order.amount_paid_so_far);

      if (remainingBalance <= 0) {
        return res.status(400).json({
          message: "This order is already fully paid."
        });
      }

      if (Number(amount_paid) < remainingBalance) {
        return res.status(400).json({
          message: "Payment must cover the remaining balance."
        });
      }

      const allowedMethods = ["Cash", "GCash", "Bank Transfer"];

      if (!allowedMethods.includes(payment_method)) {
        return res.status(400).json({
          message: "Invalid payment method."
        });
      }

      const changeAmount = Number(amount_paid) - remainingBalance;

      const recordPayment = database.transaction(() => {
        database.prepare(`
          INSERT INTO payments (
            order_id,
            amount_paid,
            change_amount,
            payment_method,
            payment_date
          )
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        `).run(
          order_id,
          Number(amount_paid),
          changeAmount,
          payment_method
        );

        database.prepare(`
          UPDATE orders
          SET order_status = 'Paid'
          WHERE order_id = ?
        `).run(order_id);
      });

      recordPayment();

      res.status(201).json({
        message: "Payment recorded successfully!",
        change_amount: changeAmount
      });

    } catch (error) {
      res.status(500).json({
        message: "Unable to record payment."
      });
    }
  });

  return router;
};
