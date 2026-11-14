
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;
const SECRET_KEY = "small-business-secret-key";

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const databaseFolder = path.join(__dirname, "database");

if (!fs.existsSync(databaseFolder)) {
  fs.mkdirSync(databaseFolder, { recursive: true });
}

const db = new Database(path.join(databaseFolder, "business.db"));

db.pragma("foreign_keys = ON");

// Create database tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_name TEXT NOT NULL,
  category_id INTEGER,
  price REAL NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  contact_number TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  total_amount REAL NOT NULL,
  order_date TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'Paid',
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS order_details (
  detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  amount_paid REAL NOT NULL,
  change_amount REAL NOT NULL,
  payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS inventory (
  inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  movement_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
`);

// Authentication middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Please login first."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

// Home
app.get("/", (req, res) => {
  res.send("Small Business Management System API is running!");
});

// REGISTER
app.post("/api/auth/register", (req, res) => {
  const { fullname, username, password } = req.body;

  if (!fullname || !username || !password) {
    return res.status(400).json({
      message: "Please complete all fields."
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters."
    });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (fullname, username, password)
      VALUES (?, ?, ?)
    `).run(fullname, username, hashedPassword);

    res.status(201).json({
      message: "Registration successful!"
    });
  } catch (error) {
    res.status(409).json({
      message: "Username already exists."
    });
  }
});

// LOGIN
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Please enter username and password."
    });
  }

  const user = db.prepare(`
    SELECT * FROM users WHERE username = ?
  `).get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({
      message: "Incorrect username or password."
    });
  }

  if (user.status !== "Active") {
    return res.status(403).json({
      message: "Your account is inactive."
    });
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      role: user.role
    },
    SECRET_KEY,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login successful!",
    token,
    user: {
      user_id: user.user_id,
      fullname: user.fullname,
      username: user.username,
      role: user.role
    }
  });
});

// Apply authentication to the remaining API routes
app.use("/api", verifyToken);

// DASHBOARD
app.get("/api/dashboard", (req, res) => {
  const totalProducts = db.prepare(
    "SELECT COUNT(*) AS total FROM products"
  ).get().total;

  const totalCustomers = db.prepare(
    "SELECT COUNT(*) AS total FROM customers"
  ).get().total;

  const totalOrders = db.prepare(
    "SELECT COUNT(*) AS total FROM orders"
  ).get().total;

  const totalSales = db.prepare(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'Paid'"
  ).get().total;

  res.json({
    totalProducts,
    totalCustomers,
    totalOrders,
    totalSales
  });
});

// CATEGORIES
app.get("/api/categories", (req, res) => {
  const categories = db.prepare(
    "SELECT * FROM categories ORDER BY category_id DESC"
  ).all();

  res.json(categories);
});

app.post("/api/categories", (req, res) => {
  const { category_name } = req.body;

  if (!category_name) {
    return res.status(400).json({
      message: "Category name is required."
    });
  }

  try {
    const result = db.prepare(
      "INSERT INTO categories (category_name) VALUES (?)"
    ).run(category_name);

    res.status(201).json({
      message: "Category added successfully!",
      category_id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(400).json({
      message: "Category already exists or is invalid."
    });
  }
});

app.put("/api/categories/:id", (req, res) => {
  const { category_name } = req.body;

  const result = db.prepare(
    "UPDATE categories SET category_name = ? WHERE category_id = ?"
  ).run(category_name, req.params.id);

  res.json({
    message: result.changes
      ? "Category updated successfully!"
      : "Category not found."
  });
});

app.delete("/api/categories/:id", (req, res) => {
  try {
    const result = db.prepare(
      "DELETE FROM categories WHERE category_id = ?"
    ).run(req.params.id);

    res.json({
      message: result.changes
        ? "Category deleted successfully!"
        : "Category not found."
    });
  } catch (error) {
    res.status(400).json({
      message: "Cannot delete a category that is being used."
    });
  }
});

// PRODUCTS
app.get("/api/products", (req, res) => {
  const products = db.prepare(`
    SELECT products.*, categories.category_name
    FROM products
    LEFT JOIN categories
    ON products.category_id = categories.category_id
    ORDER BY products.product_id DESC
  `).all();

  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { product_name, category_id, price, stock_quantity } = req.body;

  if (!product_name || price == null || stock_quantity == null ||
      Number(price) < 0 || !Number.isInteger(Number(stock_quantity)) ||
      Number(stock_quantity) < 0) {
    return res.status(400).json({
      message: "Please enter valid product information."
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO products
      (product_name, category_id, price, stock_quantity)
      VALUES (?, ?, ?, ?)
    `).run(
      product_name,
      category_id || null,
      Number(price),
      Number(stock_quantity)
    );

    if (Number(stock_quantity) > 0) {
      db.prepare(`
        INSERT INTO inventory
        (product_id, movement_type, quantity)
        VALUES (?, 'Stock In', ?)
      `).run(result.lastInsertRowid, Number(stock_quantity));
    }

    res.status(201).json({
      message: "Product added successfully!"
    });
  } catch (error) {
    res.status(400).json({
      message: "Unable to add product. Check the category."
    });
  }
});

app.put("/api/products/:id", (req, res) => {
  const { product_name, category_id, price, stock_quantity } = req.body;

  if (!product_name || price == null || stock_quantity == null ||
      Number(price) < 0 || !Number.isInteger(Number(stock_quantity)) ||
      Number(stock_quantity) < 0) {
    return res.status(400).json({
      message: "Please enter valid product information."
    });
  }

  const result = db.prepare(`
    UPDATE products
    SET product_name = ?, category_id = ?, price = ?, stock_quantity = ?
    WHERE product_id = ?
  `).run(
    product_name,
    category_id || null,
    Number(price),
    Number(stock_quantity),
    req.params.id
  );

  res.json({
    message: result.changes
      ? "Product updated successfully!"
      : "Product not found."
  });
});

app.delete("/api/products/:id", (req, res) => {
  try {
    const result = db.prepare(
      "DELETE FROM products WHERE product_id = ?"
    ).run(req.params.id);

    res.json({
      message: result.changes
        ? "Product deleted successfully!"
        : "Product not found."
    });
  } catch (error) {
    res.status(400).json({
      message: "Cannot delete a product with existing sales or inventory records."
    });
  }
});

// CUSTOMERS
app.get("/api/customers", (req, res) => {
  const customers = db.prepare(
    "SELECT * FROM customers ORDER BY customer_id DESC"
  ).all();

  res.json(customers);
});

app.post("/api/customers", (req, res) => {
  const { customer_name, contact_number, address } = req.body;

  if (!customer_name) {
    return res.status(400).json({
      message: "Customer name is required."
    });
  }

  db.prepare(`
    INSERT INTO customers (customer_name, contact_number, address)
    VALUES (?, ?, ?)
  `).run(customer_name, contact_number || "", address || "");

  res.status(201).json({
    message: "Customer added successfully!"
  });
});

app.put("/api/customers/:id", (req, res) => {
  const { customer_name, contact_number, address } = req.body;

  const result = db.prepare(`
    UPDATE customers
    SET customer_name = ?, contact_number = ?, address = ?
    WHERE customer_id = ?
  `).run(
    customer_name,
    contact_number || "",
    address || "",
    req.params.id
  );

  res.json({
    message: result.changes
      ? "Customer updated successfully!"
      : "Customer not found."
  });
});

app.delete("/api/customers/:id", (req, res) => {
  try {
    const result = db.prepare(
      "DELETE FROM customers WHERE customer_id = ?"
    ).run(req.params.id);

    res.json({
      message: result.changes
        ? "Customer deleted successfully!"
        : "Customer not found."
    });
  } catch (error) {
    res.status(400).json({
      message: "Cannot delete a customer with existing orders."
    });
  }
});

// ORDERS / SALES
app.get("/api/orders", (req, res) => {
  const orders = db.prepare(`
    SELECT orders.*, customers.customer_name
    FROM orders
    LEFT JOIN customers
    ON orders.customer_id = customers.customer_id
    ORDER BY orders.order_id DESC
  `).all();

  const getDetails = db.prepare(`
    SELECT order_details.*, products.product_name
    FROM order_details
    JOIN products
    ON order_details.product_id = products.product_id
    WHERE order_details.order_id = ?
  `);

  const result = orders.map(order => ({
    ...order,
    items: getDetails.all(order.order_id)
  }));

  res.json(result);
});

app.post("/api/orders", (req, res) => {
  const { customer_id, items, amount_paid } = req.body;

  if (!Array.isArray(items) || items.length === 0 ||
      amount_paid == null || Number(amount_paid) < 0) {
    return res.status(400).json({
      message: "Please provide order items and payment amount."
    });
  }

  try {
    const createOrder = db.transaction(() => {
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const quantity = Number(item.quantity);
        const product = db.prepare(
          "SELECT * FROM products WHERE product_id = ?"
        ).get(item.product_id);

        if (!product || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("Invalid product or quantity.");
        }

        if (product.stock_quantity < quantity) {
          throw new Error(
            "Not enough stock for " + product.product_name
          );
        }

        const subtotal = product.price * quantity;
        total += subtotal;

        orderItems.push({
          product_id: product.product_id,
          quantity,
          price: product.price,
          subtotal
        });
      }

      if (Number(amount_paid) < total) {
        throw new Error("Insufficient payment.");
      }

      const change = Number(amount_paid) - total;

      const orderResult = db.prepare(`
        INSERT INTO orders (customer_id, total_amount, status)
        VALUES (?, ?, 'Paid')
      `).run(customer_id || null, total);

      const orderId = Number(orderResult.lastInsertRowid);

      for (const item of orderItems) {
        db.prepare(`
          INSERT INTO order_details
          (order_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          orderId,
          item.product_id,
          item.quantity,
          item.price,
          item.subtotal
        );

        db.prepare(`
          UPDATE products
          SET stock_quantity = stock_quantity - ?
          WHERE product_id = ?
        `).run(item.quantity, item.product_id);

        db.prepare(`
          INSERT INTO inventory
          (product_id, movement_type, quantity)
          VALUES (?, 'Stock Out', ?)
        `).run(item.product_id, item.quantity);
      }

      db.prepare(`
        INSERT INTO payments (order_id, amount_paid, change_amount)
        VALUES (?, ?, ?)
      `).run(orderId, Number(amount_paid), change);

      return { orderId, total, change };
    });

    const result = createOrder();

    res.status(201).json({
      message: "Order and payment completed successfully!",
      ...result
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// PAYMENTS
app.get("/api/payments", (req, res) => {
  const payments = db.prepare(`
    SELECT payments.*, orders.total_amount
    FROM payments
    JOIN orders ON payments.order_id = orders.order_id
    ORDER BY payments.payment_id DESC
  `).all();

  res.json(payments);
});

// INVENTORY
app.get("/api/inventory", (req, res) => {
  const inventory = db.prepare(`
    SELECT inventory.*, products.product_name
    FROM inventory
    JOIN products ON inventory.product_id = products.product_id
    ORDER BY inventory.inventory_id DESC
  `).all();

  res.json(inventory);
});

app.post("/api/inventory", (req, res) => {
  const { product_id, movement_type, quantity } = req.body;
  const amount = Number(quantity);

  if (!product_id ||
      !["Stock In", "Stock Out"].includes(movement_type) ||
      !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Please enter valid inventory information."
    });
  }

  try {
    const updateStock = db.transaction(() => {
      const product = db.prepare(
        "SELECT * FROM products WHERE product_id = ?"
      ).get(product_id);

      if (!product) {
        throw new Error("Product not found.");
      }

      if (movement_type === "Stock Out" &&
          product.stock_quantity < amount) {
        throw new Error("Not enough available stock.");
      }

      const adjustment = movement_type === "Stock In"
        ? amount
        : -amount;

      db.prepare(`
        UPDATE products
        SET stock_quantity = stock_quantity + ?
        WHERE product_id = ?
      `).run(adjustment, product_id);

      db.prepare(`
        INSERT INTO inventory (product_id, movement_type, quantity)
        VALUES (?, ?, ?)
      `).run(product_id, movement_type, amount);
    });

    updateStock();

    res.json({
      message: "Inventory updated successfully!"
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// REPORTS
app.get("/api/reports", (req, res) => {
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS totalOrders,
      COALESCE(SUM(total_amount), 0) AS totalSales
    FROM orders
    WHERE status = 'Paid'
  `).get();

  const sales = db.prepare(`
    SELECT orders.*, customers.customer_name
    FROM orders
    LEFT JOIN customers
    ON orders.customer_id = customers.customer_id
    ORDER BY orders.order_id DESC
  `).all();

  res.json({
    summary,
    sales
  });
});

// USERS
app.get("/api/users", (req, res) => {
  const users = db.prepare(`
    SELECT user_id, fullname, username, role, status
    FROM users
    ORDER BY user_id DESC
  `).all();

  res.json(users);
});

// Update user role and status
app.put("/api/users/:id", (req, res) => {
  const { role, status } = req.body;

  if (!["Admin", "Staff"].includes(role) ||
      !["Active", "Inactive"].includes(status)) {
    return res.status(400).json({
      message: "Invalid role or status."
    });
  }

  const result = db.prepare(`
    UPDATE users
    SET role = ?, status = ?
    WHERE user_id = ?
  `).run(role, status, req.params.id);

  res.json({
    message: result.changes
      ? "User updated successfully!"
      : "User not found."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
