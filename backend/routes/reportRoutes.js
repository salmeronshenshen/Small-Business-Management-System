
const express = require("express");

module.exports = (database) => {
  const router = express.Router();

  // GET BUSINESS REPORTS
  router.get("/", (req, res) => {
    try {
      // TOTAL SALES
      const salesResult = database.prepare(`
        SELECT
          COALESCE(
            SUM(amount_paid - change_amount),
            0
          ) AS total_sales
        FROM payments
      `).get();

      // TOTAL ORDERS
      const ordersResult = database.prepare(`
        SELECT COUNT(*) AS total_orders
        FROM orders
      `).get();

      // TOTAL CUSTOMERS
      const customersResult = database.prepare(`
        SELECT COUNT(*) AS total_customers
        FROM customers
      `).get();

      // TOTAL PRODUCTS
      const productsResult = database.prepare(`
        SELECT COUNT(*) AS total_products
        FROM products
      `).get();

      // MONTHLY SALES
      const monthlySales = database.prepare(`
        SELECT
          strftime('%Y-%m', payment_date) AS month,
          SUM(amount_paid - change_amount) AS total_sales
        FROM payments
        GROUP BY strftime('%Y-%m', payment_date)
        ORDER BY month DESC
        LIMIT 6
      `).all().reverse().map((item) => ({
        ...item,
        month: new Date(
          Number(item.month.substring(0, 4)),
          Number(item.month.substring(5, 7)) - 1
        ).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric"
        })
      }));

      // TOP SELLING PRODUCTS
      const topProducts = database.prepare(`
        SELECT
          products.product_id,
          products.product_name,
          SUM(order_details.quantity) AS quantity_sold,
          SUM(order_details.subtotal) AS total_sales
        FROM order_details
        JOIN products
          ON order_details.product_id = products.product_id
        GROUP BY
          products.product_id,
          products.product_name
        ORDER BY quantity_sold DESC
        LIMIT 5
      `).all();

      // RECENT ORDERS
      const recentOrders = database.prepare(`
        SELECT
          orders.order_id,
          customers.customer_name,
          orders.total_amount,
          orders.order_date,
          orders.order_status
        FROM orders
        LEFT JOIN customers
          ON orders.customer_id = customers.customer_id
        ORDER BY orders.order_id DESC
        LIMIT 10
      `).all();

      res.json({
        totalSales: salesResult.total_sales,
        totalOrders: ordersResult.total_orders,
        totalCustomers: customersResult.total_customers,
        totalProducts: productsResult.total_products,
        monthlySales,
        topProducts,
        recentOrders
      });

    } catch (error) {
      console.error("Reports Error:", error);

      res.status(500).json({
        message: "Unable to generate business reports."
      });
    }
  });

  return router;
};
