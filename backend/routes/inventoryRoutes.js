
const express = require("express");

module.exports = (database) => {
  const router = express.Router();

  // GET INVENTORY HISTORY
  router.get("/", (req, res) => {
    try {
      const inventory = database.prepare(`
        SELECT
          inventory.inventory_id,
          inventory.product_id,
          products.product_name,
          inventory.quantity,
          inventory.movement_type,
          inventory.movement_date,
          inventory.remarks
        FROM inventory
        LEFT JOIN products
          ON inventory.product_id = products.product_id
        ORDER BY inventory.inventory_id DESC
      `).all();

      res.json(inventory);
    } catch (error) {
      res.status(500).json({
        message: "Unable to load inventory records."
      });
    }
  });

  // ADD STOCK MOVEMENT
  router.post("/", (req, res) => {
    try {
      const {
        product_id,
        quantity,
        movement_type,
        remarks
      } = req.body;

      if (
        !product_id ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 1 ||
        !["Stock In", "Stock Out"].includes(movement_type)
      ) {
        return res.status(400).json({
          message: "Please provide valid inventory information."
        });
      }

      const product = database.prepare(`
        SELECT product_id, stock_quantity
        FROM products
        WHERE product_id = ?
      `).get(product_id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      const currentStock = Number(product.stock_quantity);
      const movementQuantity = Number(quantity);

      if (
        movement_type === "Stock Out" &&
        movementQuantity > currentStock
      ) {
        return res.status(400).json({
          message: "Not enough stock available."
        });
      }

      const newStock =
        movement_type === "Stock In"
          ? currentStock + movementQuantity
          : currentStock - movementQuantity;

      const saveMovement = database.transaction(() => {
        database.prepare(`
          INSERT INTO inventory (
            product_id,
            quantity,
            movement_type,
            movement_date,
            remarks
          )
          VALUES (?, ?, ?, datetime('now', 'localtime'), ?)
        `).run(
          product_id,
          movementQuantity,
          movement_type,
          remarks ? remarks.trim() : ""
        );

        database.prepare(`
          UPDATE products
          SET stock_quantity = ?
          WHERE product_id = ?
        `).run(newStock, product_id);
      });

      saveMovement();

      res.status(201).json({
        message: `${movement_type} recorded successfully!`,
        current_stock: newStock
      });

    } catch (error) {
      res.status(500).json({
        message: "Unable to update inventory."
      });
    }
  });

  return router;
};
