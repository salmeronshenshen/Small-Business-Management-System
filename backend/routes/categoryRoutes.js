
const express = require("express");

module.exports = (database) => {
  const router = express.Router();

  // GET ALL CATEGORIES
  router.get("/", (req, res) => {
    try {
      const categories = database.prepare(`
        SELECT * FROM categories
        ORDER BY category_id DESC
      `).all();

      res.json(categories);
    } catch (error) {
      res.status(500).json({
        message: "Unable to load categories."
      });
    }
  });

  // ADD CATEGORY
  router.post("/", (req, res) => {
    try {
      const { category_name } = req.body;

      if (!category_name || !category_name.trim()) {
        return res.status(400).json({
          message: "Category name is required."
        });
      }

      const result = database.prepare(`
        INSERT INTO categories (category_name)
        VALUES (?)
      `).run(category_name.trim());

      res.status(201).json({
        message: "Category added successfully!",
        category_id: result.lastInsertRowid
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to add category."
      });
    }
  });

  // UPDATE CATEGORY
  router.put("/:id", (req, res) => {
    try {
      const { category_name } = req.body;
      const { id } = req.params;

      if (!category_name || !category_name.trim()) {
        return res.status(400).json({
          message: "Category name is required."
        });
      }

      const result = database.prepare(`
        UPDATE categories
        SET category_name = ?
        WHERE category_id = ?
      `).run(category_name.trim(), id);

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Category not found."
        });
      }

      res.json({
        message: "Category updated successfully!"
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to update category."
      });
    }
  });

  // DELETE CATEGORY
  router.delete("/:id", (req, res) => {
    try {
      const { id } = req.params;

      const result = database.prepare(`
        DELETE FROM categories
        WHERE category_id = ?
      `).run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Category not found."
        });
      }

      res.json({
        message: "Category deleted successfully!"
      });
    } catch (error) {
      res.status(500).json({
        message: "Unable to delete category. It may still be used by products."
      });
    }
  });

  return router;
};
