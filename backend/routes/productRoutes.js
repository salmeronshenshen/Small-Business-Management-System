
const express = require("express");

module.exports = (database) => {
  const router = express.Router();

  // GET ALL PRODUCTS
  router.get("/", (req, res) => {
    try {
      const products = database.prepare(`
        SELECT
          products.product_id,
          products.product_name,
          products.category_id,
          categories.category_name,
          products.price,
          products.stock_quantity
        FROM products
        LEFT JOIN categories
          ON products.category_id = categories.category_id
        ORDER BY products.product_id DESC
      `).all();

      res.json(products);
    } catch (error) {
      res.status(500).json({
        message: "Unable to load products."
      });
    }
  });

  // ADD PRODUCT
  router.post("/", (req, res) => {
    try {
      const {
        product_name,
        category_id,
        price,
        stock_quantity
      } = req.body;

      if (
        !product_name ||
        !product_name.trim() ||
        !category_id ||
        price === undefined ||
        Number(price) < 0 ||
        stock_quantity === undefined ||
        !Number.isInteger(Number(stock_quantity)) ||
        Number(stock_quantity) < 0
      ) {
        return res.status(400).json({
          message: "Please provide valid product information."
        });
      }

      const result = database.prepare(`
        INSERT INTO products (
          product_name,
          category_id,
          price,
          stock_quantity
        )
        VALUES (?, ?, ?, ?)
      `).run(
        product_name.trim(),
        category_id,
        Number(price),
        Number(stock_quantity)
      );

      res.status(201).json({
        message: "Product added successfully!",
        product_id: result.lastInsertRowid
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to add product. Please check the category."
      });
    }
  });

  // UPDATE PRODUCT
  router.put("/:id", (req, res) => {
    try {
      const { id } = req.params;

      const {
        product_name,
        category_id,
        price,
        stock_quantity
      } = req.body;

      if (
        !product_name ||
        !product_name.trim() ||
        !category_id ||
        price === undefined ||
        Number(price) < 0 ||
        stock_quantity === undefined ||
        !Number.isInteger(Number(stock_quantity)) ||
        Number(stock_quantity) < 0
      ) {
        return res.status(400).json({
          message: "Please provide valid product information."
        });
      }

      const result = database.prepare(`
        UPDATE products
        SET
          product_name = ?,
          category_id = ?,
          price = ?,
          stock_quantity = ?
        WHERE product_id = ?
      `).run(
        product_name.trim(),
        category_id,
        Number(price),
        Number(stock_quantity),
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      res.json({
        message: "Product updated successfully!"
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to update product. Please check the category."
      });
    }
  });

  // DELETE PRODUCT
  router.delete("/:id", (req, res) => {
    try {
      const { id } = req.params;

      const result = database.prepare(`
        DELETE FROM products
        WHERE product_id = ?
      `).run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      res.json({
        message: "Product deleted successfully!"
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to delete product. This product may already be used in an order or inventory record."
      });
    }
  });

  return router;
};
