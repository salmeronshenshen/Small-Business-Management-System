
const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

module.exports = (db, verifyToken) => {

  // ADMIN ACCESS ONLY
  const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        message: "Access denied. Admin only."
      });
    }

    next();
  };

  // GET ALL USERS
  router.get("/", verifyToken, adminOnly, (req, res) => {
    try {
      const users = db.prepare(`
        SELECT user_id, fullname, username, role
        FROM users
        ORDER BY user_id DESC
      `).all();

      res.json(users);

    } catch (error) {
      console.error("Get users error:", error);

      res.status(500).json({
        message: "Failed to retrieve users."
      });
    }
  });

  // ADD USER
  router.post("/", verifyToken, adminOnly, async (req, res) => {
    try {
      const { fullname, username, password, role } = req.body;

      if (!fullname || !username || !password || !role) {
        return res.status(400).json({
          message: "Please complete all required fields."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters."
        });
      }

      if (!["Admin", "Staff"].includes(role)) {
        return res.status(400).json({
          message: "Invalid user role."
        });
      }

      const existingUser = db.prepare(`
        SELECT user_id FROM users
        WHERE username = ?
      `).get(username.trim());

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists."
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = db.prepare(`
        INSERT INTO users (fullname, username, password, role)
        VALUES (?, ?, ?, ?)
      `).run(
        fullname.trim(),
        username.trim(),
        hashedPassword,
        role
      );

      res.status(201).json({
        message: "User added successfully!",
        user_id: result.lastInsertRowid
      });

    } catch (error) {
      console.error("Add user error:", error);

      res.status(500).json({
        message: "Failed to add user."
      });
    }
  });

  // UPDATE USER
  router.put("/:id", verifyToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const { fullname, username, password, role } = req.body;

      if (!fullname || !username || !role) {
        return res.status(400).json({
          message: "Please complete all required fields."
        });
      }

      if (!["Admin", "Staff"].includes(role)) {
        return res.status(400).json({
          message: "Invalid user role."
        });
      }

      const user = db.prepare(`
        SELECT * FROM users
        WHERE user_id = ?
      `).get(id);

      if (!user) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      const existingUser = db.prepare(`
        SELECT user_id FROM users
        WHERE username = ? AND user_id != ?
      `).get(username.trim(), id);

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists."
        });
      }

      if (password && password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters."
        });
      }

      if (password && password.trim()) {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
          UPDATE users
          SET fullname = ?, username = ?, password = ?, role = ?
          WHERE user_id = ?
        `).run(
          fullname.trim(),
          username.trim(),
          hashedPassword,
          role,
          id
        );

      } else {
        db.prepare(`
          UPDATE users
          SET fullname = ?, username = ?, role = ?
          WHERE user_id = ?
        `).run(
          fullname.trim(),
          username.trim(),
          role,
          id
        );
      }

      res.json({
        message: "User updated successfully!"
      });

    } catch (error) {
      console.error("Update user error:", error);

      res.status(500).json({
        message: "Failed to update user."
      });
    }
  });

  // DELETE USER
  router.delete("/:id", verifyToken, adminOnly, (req, res) => {
    try {
      const { id } = req.params;

      const currentUserId = req.user.user_id || req.user.id;

      if (Number(id) === Number(currentUserId)) {
        return res.status(400).json({
          message: "You cannot delete your own account."
        });
      }

      const user = db.prepare(`
        SELECT user_id FROM users
        WHERE user_id = ?
      `).get(id);

      if (!user) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      db.prepare(`
        DELETE FROM users
        WHERE user_id = ?
      `).run(id);

      res.json({
        message: "User deleted successfully!"
      });

    } catch (error) {
      console.error("Delete user error:", error);

      res.status(500).json({
        message: "Failed to delete user."
      });
    }
  });

  return router;
};
