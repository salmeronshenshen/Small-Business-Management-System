const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// =====================================
// DATABASE SETUP
// =====================================

const databaseFolder = path.join(__dirname, "database");

if (!fs.existsSync(databaseFolder)) {
  fs.mkdirSync(databaseFolder, { recursive: true });
}

const db = new Database(
  path.join(databaseFolder, "business.db")
);

db.pragma("foreign_keys = ON");

// =====================================
// CREATE USERS TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Customer',
    status TEXT DEFAULT 'Active'
  )
`).run();
// =====================================
// CREATE CATEGORIES TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  )
`).run();

// =====================================
// CREATE PRODUCTS TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    category_id INTEGER,
    price REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
  )
`).run();

// =====================================
// PRODUCTS TABLE MIGRATION
// =====================================

const productColumns = db.prepare(
  "PRAGMA table_info(products)"
).all();

const hasStock = productColumns.some(
  column => column.name === "stock"
);

if (!hasStock) {
  db.prepare(`
    ALTER TABLE products
    ADD COLUMN stock INTEGER DEFAULT 0
  `).run();

  // COPY OLD STOCK VALUES IF AVAILABLE
  const oldStockColumn = productColumns.find(
    column =>
      ["stock_quantity", "quantity", "stocks"].includes(column.name)
  );

  if (oldStockColumn) {
    const allowedColumns = [
      "stock_quantity",
      "quantity",
      "stocks"
    ];

    if (allowedColumns.includes(oldStockColumn.name)) {
      db.prepare(`
        UPDATE products
        SET stock = COALESCE(${oldStockColumn.name}, 0)
      `).run();
    }
  }

  console.log("Products stock column successfully migrated!");
}


// =====================================
// CREATE PRODUCT SHADES TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS product_shades (
    shade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    shade_name TEXT NOT NULL,
    FOREIGN KEY (product_id)
      REFERENCES products(product_id)
      ON DELETE CASCADE,
    UNIQUE(product_id, shade_name)
  )
`).run();

// =====================================
// ADD is_active COLUMN TO EXISTING TABLES
// =====================================

try {
  db.prepare(`
    ALTER TABLE categories
    ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
  `).run();
} catch (error) {
  if (!error.message.includes("duplicate column name")) {
    throw error;
  }
}

try {
  db.prepare(`
    ALTER TABLE products
    ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
  `).run();
} catch (error) {
  if (!error.message.includes("duplicate column name")) {
    throw error;
  }
}

// =====================================
// CREATE CUSTOMERS TABLE
// IMPORTANT: EXISTING DATABASE USES
// customer_name, contact_number
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    contact_number TEXT,
    address TEXT,
    user_id INTEGER
  )
`).run();

// ADD USER ID IF MISSING
const customerColumns = db.prepare(
  "PRAGMA table_info(customers)"
).all();

const hasUserId = customerColumns.some(
  column => column.name === "user_id"
);

if (!hasUserId) {
  db.prepare(`
    ALTER TABLE customers
    ADD COLUMN user_id INTEGER
  `).run();
}

// CREATE UNIQUE INDEX
db.prepare(`
  CREATE UNIQUE INDEX IF NOT EXISTS
  idx_customers_user_id
  ON customers(user_id)
  WHERE user_id IS NOT NULL
`).run();

// =====================================
// CREATE ORDERS TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  )
`).run();

// =====================================
// CREATE ORDER DETAILS TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS order_details (
    detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    subtotal REAL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
  )
`).run();


/* =====================================
   PRODUCT SHADES TABLE
===================================== */

db.exec(`
  CREATE TABLE IF NOT EXISTS product_shades (
    shade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    shade_name TEXT NOT NULL,
    FOREIGN KEY (product_id)
      REFERENCES products(product_id)
      ON DELETE CASCADE,
    UNIQUE (product_id, shade_name)
  )
`);


/* =====================================
   CHECK ORDER DETAILS SHADE COLUMN
===================================== */

const shadeColumnInfo = db.prepare(`
  PRAGMA table_info(order_details)
`).all();

const shadeColumnExists = shadeColumnInfo.some(
  column => column.name === "shade"
);

if (!shadeColumnExists) {
  db.exec(`
    ALTER TABLE order_details
    ADD COLUMN shade TEXT
  `);
}


// =====================================
// ADD SHADE COLUMN TO ORDER DETAILS
// =====================================
const orderDetailColumns = db.prepare(
  "PRAGMA table_info(order_details)"
).all();

const hasShadeColumn = orderDetailColumns.some(
  column => column.name === "shade"
);

if (!hasShadeColumn) {
  db.prepare(`
    ALTER TABLE order_details
    ADD COLUMN shade TEXT
  `).run();
}

// =====================================
// CREATE PAYMENTS TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    amount_paid REAL DEFAULT 0,
    payment_method TEXT,
    payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  )
`).run();

// ADD CHANGE AMOUNT IF MISSING
const paymentColumns = db.prepare(
  "PRAGMA table_info(payments)"
).all();

const hasChangeAmount = paymentColumns.some(
  column => column.name === "change_amount"
);

if (!hasChangeAmount) {
  db.prepare(`
    ALTER TABLE payments
    ADD COLUMN change_amount REAL DEFAULT 0
  `).run();
}

// ADD PAYMENT METHOD IF MISSING
const hasPaymentMethod = paymentColumns.some(
  column => column.name === "payment_method"
);

if (!hasPaymentMethod) {
  db.prepare(`
    ALTER TABLE payments
    ADD COLUMN payment_method TEXT
  `).run();
}

// =====================================
// CREATE INVENTORY TABLE
// =====================================

db.prepare(`
  CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER DEFAULT 0,
    movement_type TEXT,
    movement_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
  )
`).run();

// ADD REMARKS COLUMN IF MISSING

const inventoryColumns = db.prepare(
  "PRAGMA table_info(inventory)"
).all();

const hasRemarks = inventoryColumns.some(
  column => column.name === "remarks"
);

if (!hasRemarks) {
  db.prepare(`
    ALTER TABLE inventory
    ADD COLUMN remarks TEXT
  `).run();
}

// =====================================
// UPDATE OLD CATEGORY NAMES
// =====================================

function renameOrMergeCategory(oldName, newName) {
  const oldCategory = db.prepare(`
    SELECT category_id
    FROM categories
    WHERE LOWER(category_name) = LOWER(?)
  `).get(oldName);

  if (!oldCategory) return;

  const newCategory = db.prepare(`
    SELECT category_id
    FROM categories
    WHERE LOWER(category_name) = LOWER(?)
  `).get(newName);

  if (newCategory) {
    db.prepare(`
      UPDATE products
      SET category_id = ?
      WHERE category_id = ?
    `).run(newCategory.category_id, oldCategory.category_id);

    db.prepare(`
      UPDATE categories
      SET is_active = 0
      WHERE category_id = ?
    `).run(oldCategory.category_id);
  } else {
    db.prepare(`
      UPDATE categories
      SET category_name = ?, is_active = 1
      WHERE category_id = ?
    `).run(newName, oldCategory.category_id);
  }
}

renameOrMergeCategory("Lippie", "Lip Products");
renameOrMergeCategory("Makeup", "Face Makeup");
renameOrMergeCategory("Hairclip", "Beauty Accessories");

// =====================================
// HIDE OLD UNRELATED PRODUCTS
// =====================================

db.prepare(`
  UPDATE products
  SET is_active = 0
  WHERE category_id IN (
    SELECT category_id
    FROM categories
    WHERE LOWER(category_name) IN (
      'bags',
      'tops',
      'jacket',
      'pants',
      'sandals'
    )
  )
`).run();

db.prepare(`
  UPDATE categories
  SET is_active = 0
  WHERE LOWER(category_name) IN (
    'bags',
    'tops',
    'jacket',
    'pants',
    'sandals'
  )
`).run();

// =====================================
// BEAUTY FINDS CATEGORIES
// =====================================

const defaultCategories = [
  "Lip Products",
  "Face Makeup",
  "Skincare",
  "Eye Makeup",
  "Body Care",
  "Beauty Accessories"
];

const insertCategory = db.prepare(`
  INSERT INTO categories (category_name)
  SELECT ?
  WHERE NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE LOWER(category_name) = LOWER(?)
  )
`);

defaultCategories.forEach(category => {
  insertCategory.run(category, category);
});

// Make sure default categories are active
db.prepare(`
  UPDATE categories
  SET is_active = 1
  WHERE LOWER(category_name) IN (
    'lip products',
    'face makeup',
    'skincare',
    'eye makeup',
    'body care',
    'beauty accessories'
  )
`).run();

// =====================================
// DEFAULT BEAUTY PRODUCTS
// =====================================

const defaultProducts = [
  // LIP PRODUCTS
  { name: "Lip Tint", category: "Lip Products", price: 99, stock: 20 },
  { name: "Lip Gloss", category: "Lip Products", price: 120, stock: 15 },
  { name: "Matte Lipstick", category: "Lip Products", price: 150, stock: 15 },
  { name: "Lip Balm", category: "Lip Products", price: 75, stock: 20 },
  { name: "Lip Oil", category: "Lip Products", price: 130, stock: 15 },

  // FACE MAKEUP
  { name: "Blush On", category: "Face Makeup", price: 100, stock: 20 },
  { name: "Face Powder", category: "Face Makeup", price: 150, stock: 15 },
  { name: "Foundation", category: "Face Makeup", price: 180, stock: 15 },
  { name: "Concealer", category: "Face Makeup", price: 140, stock: 15 },
  { name: "Highlighter", category: "Face Makeup", price: 160, stock: 10 },

  // SKINCARE
  { name: "Facial Cleanser", category: "Skincare", price: 120, stock: 20 },
  { name: "Facial Toner", category: "Skincare", price: 130, stock: 15 },
  { name: "Facial Serum", category: "Skincare", price: 180, stock: 15 },
  { name: "Moisturizer", category: "Skincare", price: 150, stock: 15 },
  { name: "Sunscreen", category: "Skincare", price: 170, stock: 20 },

  // EYE MAKEUP
  { name: "Mascara", category: "Eye Makeup", price: 120, stock: 15 },
  { name: "Eyeliner", category: "Eye Makeup", price: 90, stock: 20 },
  { name: "Eyebrow Pencil", category: "Eye Makeup", price: 85, stock: 20 },
  { name: "Eyeshadow Palette", category: "Eye Makeup", price: 200, stock: 10 },

  // BODY CARE
  { name: "Body Lotion", category: "Body Care", price: 150, stock: 15 },
  { name: "Body Scrub", category: "Body Care", price: 160, stock: 10 },
  { name: "Body Wash", category: "Body Care", price: 130, stock: 15 },
  { name: "Body Mist", category: "Body Care", price: 180, stock: 15 },

  // BEAUTY ACCESSORIES
  { name: "Makeup Brush Set", category: "Beauty Accessories", price: 180, stock: 10 },
  { name: "Beauty Blender", category: "Beauty Accessories", price: 60, stock: 20 },
  { name: "Powder Puff", category: "Beauty Accessories", price: 40, stock: 20 },
  { name: "Cosmetic Pouch", category: "Beauty Accessories", price: 100, stock: 15 },
  { name: "Compact Mirror", category: "Beauty Accessories", price: 50, stock: 15 }
];

// =====================================
// INSERT DEFAULT PRODUCTS ONLY ONCE
// =====================================

const insertProduct = db.prepare(`
  INSERT INTO products (
    product_name,
    category_id,
    price,
    stock,
    is_active
  )
  SELECT ?, ?, ?, ?, 1
  WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE LOWER(product_name) = LOWER(?)
    AND category_id = ?
  )
`);

const insertInitialInventory = db.prepare(`
  INSERT INTO inventory (
    product_id,
    quantity,
    movement_type
  )
  VALUES (?, ?, 'IN')
`);

const seedProducts = db.transaction(() => {
  for (const product of defaultProducts) {
    const category = db.prepare(`
      SELECT category_id
      FROM categories
      WHERE LOWER(category_name) = LOWER(?)
    `).get(product.category);

    if (!category) continue;

    const existingProduct = db.prepare(`
      SELECT product_id
      FROM products
      WHERE LOWER(product_name) = LOWER(?)
      AND category_id = ?
    `).get(product.name, category.category_id);

    if (!existingProduct) {
      const result = insertProduct.run(
        product.name,
        category.category_id,
        product.price,
        product.stock,
        product.name,
        category.category_id
      );

      if (result.changes > 0) {
        insertInitialInventory.run(
          Number(result.lastInsertRowid),
          product.stock
        );
      }
    } else {
      // Reactivate existing default beauty products
      db.prepare(`
        UPDATE products
        SET is_active = 1
        WHERE product_id = ?
      `).run(existingProduct.product_id);
    }
  }
});

seedProducts();

// =====================================
// DEFAULT PRODUCT SHADES
// =====================================

const defaultShades = {
  "Lip Tint": [
    "Cherry Red",
    "Rose Pink",
    "Peach",
    "Nude",
    "Berry"
  ],

  "Lip Gloss": [
    "Clear",
    "Pink",
    "Peach",
    "Red"
  ],

  "Matte Lipstick": [
    "Classic Red",
    "Rose",
    "Nude",
    "Wine"
  ],

  "Blush On": [
    "Baby Pink",
    "Peach",
    "Coral",
    "Rose",
    "Mauve"
  ],

  "Face Powder": [
    "Ivory",
    "Natural",
    "Beige",
    "Honey"
  ],

  "Foundation": [
    "Porcelain",
    "Ivory",
    "Natural",
    "Warm Beige",
    "Honey"
  ],

  "Concealer": [
    "Light",
    "Natural",
    "Medium",
    "Beige",
    "Warm"
  ],

  "JMCY": [
    "Cherry Red",
    "Rose Pink",
    "Nude",
    "Peach",
    "Berry"
  ]
};

// INSERT DEFAULT SHADES
const insertDefaultShade = db.prepare(`
  INSERT OR IGNORE INTO product_shades
  (product_id, shade_name)
  VALUES (?, ?)
`);

for (const productName in defaultShades) {
  const product = db.prepare(`
    SELECT product_id
    FROM products
    WHERE LOWER(product_name) = LOWER(?)
  `).get(productName);

  if (product) {
    defaultShades[productName].forEach((shade) => {
      insertDefaultShade.run(product.product_id, shade);
    });
  }
}

// =====================================
// CONNECT EXISTING CUSTOMER ACCOUNTS
// =====================================

const existingCustomerUsers = db.prepare(`
  SELECT user_id, fullname
  FROM users
  WHERE role = 'Customer'
`).all();

const findCustomerLink = db.prepare(`
  SELECT customer_id
  FROM customers
  WHERE user_id = ?
`);

const insertMissingCustomer = db.prepare(`
  INSERT INTO customers (customer_name, user_id)
  VALUES (?, ?)
`);

const connectExistingCustomers = db.transaction(() => {
  for (const user of existingCustomerUsers) {
    const linkedCustomer = findCustomerLink.get(user.user_id);

    if (!linkedCustomer) {
      insertMissingCustomer.run(
        user.fullname,
        user.user_id
      );
    }
  }
});

connectExistingCustomers();

// =====================================
// CREATE DEFAULT ADMIN ACCOUNT
// =====================================

const admin = db.prepare(`
  SELECT *
  FROM users
  WHERE username = ?
`).get("admin");

if (!admin) {
  const hashedPassword = bcrypt.hashSync("Admin123!", 10);

  db.prepare(`
    INSERT INTO users
    (fullname, username, password, role, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    "Administrator",
    "admin",
    hashedPassword,
    "Admin",
    "Active"
  );

  console.log("Default Admin account created!");
} else {
  db.prepare(`
    UPDATE users
    SET role = 'Admin'
    WHERE username = 'admin'
  `).run();
}

// =====================================
// SECRET KEY
// =====================================

const SECRET_KEY = "small-business-secret-key";

// =====================================
// HOME ROUTE
// =====================================

app.get("/", (req, res) => {
  res.send("Small Business Management System API is running!");
});

// =====================================
// CUSTOMER REGISTRATION
// =====================================

app.post("/api/auth/register", (req, res) => {
  try {
    const { fullname, username, password } = req.body;

    if (
      typeof fullname !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      !fullname.trim() ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill in all fields."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters."
      });
    }

    const cleanFullname = fullname.trim();
    const cleanUsername = username.trim();

    const existingUser = db.prepare(`
      SELECT user_id
      FROM users
      WHERE username = ?
    `).get(cleanUsername);

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const registerCustomer = db.transaction(() => {

      const userResult = db.prepare(`
        INSERT INTO users
        (fullname, username, password, role, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        cleanFullname,
        cleanUsername,
        hashedPassword,
        "Customer",
        "Active"
      );

      const userId = Number(userResult.lastInsertRowid);

      db.prepare(`
        INSERT INTO customers
        (customer_name, user_id)
        VALUES (?, ?)
      `).run(
        cleanFullname,
        userId
      );

      return userId;
    });

    registerCustomer();

    res.status(201).json({
      message: "Customer account created successfully!"
    });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    res.status(500).json({
      message: "Registration failed."
    });
  }
});

// =====================================
// LOGIN ROUTE
// CUSTOMER AND ADMIN
// =====================================

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please enter your username and password."
      });
    }

    const user = db.prepare(`
      SELECT *
      FROM users
      WHERE username = ?
    `).get(username.trim());

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is inactive."
      });
    }

    const passwordMatch = bcrypt.compareSync(
      password,
      user.password
    );
    
    console.log("LOGIN DIAGNOSTIC:", {
      usernameFound: !!user,
      storedPasswordIsBcrypt: user.password.startsWith("$2"),
      passwordMatch: passwordMatch
    });

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password."
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
      token: token,
      user: {
        user_id: user.user_id,
        fullname: user.fullname,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed."
    });
  }
});

// =====================================
// VERIFY TOKEN
// =====================================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No valid token provided."
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

// =====================================
// CUSTOMER ONLY
// =====================================

function verifyCustomer(req, res, next) {
  if (req.user.role !== "Customer") {
    return res.status(403).json({
      message: "Customer access only."
    });
  }

  next();
}

// =====================================
// ADMIN AND STAFF ONLY
// =====================================

function verifyAdminOrStaff(req, res, next) {
  if (
    req.user.role !== "Admin" &&
    req.user.role !== "Staff"
  ) {
    return res.status(403).json({
      message: "Admin and Staff access only."
    });
  }

  next();
}

// =====================================
// ADMIN ONLY
// =====================================

function verifyAdmin(req, res, next) {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access only."
    });
  }

  next();
}
// =====================================
// ADMIN: GET CATEGORIES
// =====================================

app.get(
  "/api/categories",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const categories = db.prepare(`
        SELECT *
        FROM categories
        WHERE is_active = 1
        ORDER BY category_name ASC
      `).all();

      res.json(categories);

    } catch (error) {
      console.error("Categories error:", error);

      res.status(500).json({
        message: "Unable to load categories."
      });
    }
  }
);


// =====================================
// ADMIN: ADD CATEGORY
// =====================================

app.post(
  "/api/categories",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const { category_name } = req.body;

      const cleanName =
        typeof category_name === "string"
          ? category_name.trim()
          : "";

      if (!cleanName) {
        return res.status(400).json({
          message: "Please enter a category name."
        });
      }

      const existingCategory = db.prepare(`
        SELECT category_id
        FROM categories
        WHERE LOWER(category_name) = LOWER(?)
      `).get(cleanName);

      if (existingCategory) {
        return res.status(409).json({
          message: "Category already exists."
        });
      }

      db.prepare(`
        INSERT INTO categories (category_name)
        VALUES (?)
      `).run(cleanName);

      res.status(201).json({
        message: "Category added successfully!"
      });

    } catch (error) {
      console.error("Add category error:", error);

      res.status(500).json({
        message: "Unable to add category."
      });
    }
  }
);

// =====================================
// ADMIN: UPDATE CATEGORY
// =====================================

app.put(
  "/api/categories/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const categoryId = Number(req.params.id);
      const { category_name } = req.body;

      const cleanName =
        typeof category_name === "string"
          ? category_name.trim()
          : "";

      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0 ||
        !cleanName
      ) {
        return res.status(400).json({
          message: "Please enter a valid category name."
        });
      }

      const existingCategory = db.prepare(`
        SELECT category_id
        FROM categories
        WHERE category_id = ?
      `).get(categoryId);

      if (!existingCategory) {
        return res.status(404).json({
          message: "Category not found."
        });
      }

      const duplicateCategory = db.prepare(`
        SELECT category_id
        FROM categories
        WHERE LOWER(category_name) = LOWER(?)
        AND category_id != ?
      `).get(cleanName, categoryId);

      if (duplicateCategory) {
        return res.status(409).json({
          message: "Category name already exists."
        });
      }

      db.prepare(`
        UPDATE categories
        SET category_name = ?
        WHERE category_id = ?
      `).run(cleanName, categoryId);

      res.json({
        message: "Category updated successfully!"
      });

    } catch (error) {
      console.error("Update category error:", error);

      res.status(500).json({
        message: "Unable to update category."
      });
    }
  }
);

// =====================================
// ADMIN: DELETE CATEGORY
// =====================================

app.delete(
  "/api/categories/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const categoryId = Number(req.params.id);

      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid category ID."
        });
      }

      const category = db.prepare(`
        SELECT category_id
        FROM categories
        WHERE category_id = ?
      `).get(categoryId);

      if (!category) {
        return res.status(404).json({
          message: "Category not found."
        });
      }

      const hasProducts = db.prepare(`
        SELECT product_id
        FROM products
        WHERE category_id = ?
        LIMIT 1
      `).get(categoryId);

      if (hasProducts) {
        return res.status(400).json({
          message: "Cannot delete this category because it has existing products."
        });
      }

      db.prepare(`
        DELETE FROM categories
        WHERE category_id = ?
      `).run(categoryId);

      res.json({
        message: "Category deleted successfully!"
      });

    } catch (error) {
      console.error("Delete category error:", error);

      res.status(500).json({
        message: "Unable to delete category."
      });
    }
  }
);


// =====================================
// ADMIN: ADD PRODUCT
// =====================================

app.post(
  "/api/products",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const {
        product_name,
        category_id,
        price,
        stock_quantity
      } = req.body;

      const cleanName =
        typeof product_name === "string"
          ? product_name.trim()
          : "";

      const categoryId = Number(category_id);
      const productPrice = Number(price);
      const stock = Number(stock_quantity);

      if (
        !cleanName ||
        !Number.isInteger(categoryId) ||
        categoryId <= 0 ||
        !Number.isFinite(productPrice) ||
        productPrice < 0 ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        return res.status(400).json({
          message: "Please enter valid product information."
        });
      }

      const category = db.prepare(`
        SELECT category_id
        FROM categories
        WHERE category_id = ?
      `).get(categoryId);

      if (!category) {
        return res.status(400).json({
          message: "Selected category does not exist."
        });
      }

      const result = db.transaction(() => {
        const productResult = db.prepare(`
          INSERT INTO products (
            product_name,
            category_id,
            price,
            stock
          )
          VALUES (?, ?, ?, ?)
        `).run(
          cleanName,
          categoryId,
          productPrice,
          stock
        );

        if (stock > 0) {
          db.prepare(`
            INSERT INTO inventory (
              product_id,
              quantity,
              movement_type
            )
            VALUES (?, ?, 'IN')
          `).run(
            Number(productResult.lastInsertRowid),
            stock
          );
        }

        return productResult.lastInsertRowid;
      })();

      res.status(201).json({
        message: "Product added successfully!",
        product_id: Number(result)
      });

    } catch (error) {
      console.error("Add product error:", error);

      res.status(500).json({
        message: "Unable to add product."
      });
    }
  }
);

// =====================================
// ADMIN: UPDATE PRODUCT
// =====================================

app.put(
  "/api/products/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const productId = Number(req.params.id);

      const {
        product_name,
        category_id,
        price,
        stock_quantity
      } = req.body;

      const cleanName =
        typeof product_name === "string"
          ? product_name.trim()
          : "";

      const categoryId = Number(category_id);
      const productPrice = Number(price);
      const stock = Number(stock_quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !cleanName ||
        !Number.isInteger(categoryId) ||
        categoryId <= 0 ||
        !Number.isFinite(productPrice) ||
        productPrice < 0 ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        return res.status(400).json({
          message: "Please enter valid product information."
        });
      }

      const existingProduct = db.prepare(`
        SELECT product_id, stock
        FROM products
        WHERE product_id = ?
      `).get(productId);

      if (!existingProduct) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      const category = db.prepare(`
        SELECT category_id
        FROM categories
        WHERE category_id = ?
      `).get(categoryId);

      if (!category) {
        return res.status(400).json({
          message: "Selected category does not exist."
        });
      }

      db.transaction(() => {
        db.prepare(`
          UPDATE products
          SET
            product_name = ?,
            category_id = ?,
            price = ?,
            stock = ?
          WHERE product_id = ?
        `).run(
          cleanName,
          categoryId,
          productPrice,
          stock,
          productId
        );

        const stockDifference =
          stock - Number(existingProduct.stock);

        if (stockDifference !== 0) {
          db.prepare(`
            INSERT INTO inventory (
              product_id,
              quantity,
              movement_type
            )
            VALUES (?, ?, ?)
          `).run(
            productId,
            Math.abs(stockDifference),
            stockDifference > 0 ? "IN" : "OUT"
          );
        }
      })();

      res.json({
        message: "Product updated successfully!"
      });

    } catch (error) {
      console.error("Update product error:", error);

      res.status(500).json({
        message: "Unable to update product."
      });
    }
  }
);

// =====================================
// ADMIN: DELETE PRODUCT
// =====================================

app.delete(
  "/api/products/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const productId = Number(req.params.id);

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
          message: "Invalid product ID."
        });
      }

      const product = db.prepare(`
        SELECT product_id
        FROM products
        WHERE product_id = ?
      `).get(productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      const hasOrders = db.prepare(`
        SELECT detail_id
        FROM order_details
        WHERE product_id = ?
        LIMIT 1
      `).get(productId);

      if (hasOrders) {
        return res.status(400).json({
          message: "This product has existing order records and cannot be deleted."
        });
      }

      db.transaction(() => {
        db.prepare(`
          DELETE FROM inventory
          WHERE product_id = ?
        `).run(productId);

        db.prepare(`
          DELETE FROM products
          WHERE product_id = ?
        `).run(productId);
      })();

      res.json({
        message: "Product deleted successfully!"
      });

    } catch (error) {
      console.error("Delete product error:", error);

      res.status(500).json({
        message: "Unable to delete product."
      });
    }
  }
);


// =====================================
// ADMIN: GET PRODUCT SHADES
// =====================================

app.get(
  "/api/products/:id/shades",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const productId = Number(req.params.id);

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
          message: "Invalid product ID."
        });
      }

      const product = db.prepare(`
        SELECT product_id
        FROM products
        WHERE product_id = ?
      `).get(productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      const shades = db.prepare(`
        SELECT shade_id, product_id, shade_name
        FROM product_shades
        WHERE product_id = ?
        ORDER BY shade_name ASC
      `).all(productId);

      res.json(shades);

    } catch (error) {
      console.error("Get shades error:", error);

      res.status(500).json({
        message: "Unable to load product shades."
      });
    }
  }
);

// =====================================
// ADMIN: ADD PRODUCT SHADE
// =====================================

app.post(
  "/api/products/:id/shades",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const productId = Number(req.params.id);

      const shadeName =
        typeof req.body.shade_name === "string"
          ? req.body.shade_name.trim()
          : "";

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !shadeName
      ) {
        return res.status(400).json({
          message: "Please enter a valid shade name."
        });
      }

      const product = db.prepare(`
        SELECT product_id
        FROM products
        WHERE product_id = ?
      `).get(productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      const existingShade = db.prepare(`
        SELECT shade_id
        FROM product_shades
        WHERE product_id = ?
        AND LOWER(shade_name) = LOWER(?)
      `).get(productId, shadeName);

      if (existingShade) {
        return res.status(400).json({
          message: "This shade already exists."
        });
      }

      const result = db.prepare(`
        INSERT INTO product_shades (
          product_id,
          shade_name
        )
        VALUES (?, ?)
      `).run(productId, shadeName);

      res.status(201).json({
        message: "Shade added successfully!",
        shade_id: Number(result.lastInsertRowid)
      });

    } catch (error) {
      console.error("Add shade error:", error);

      res.status(500).json({
        message: "Unable to add shade."
      });
    }
  }
);

// =====================================
// ADMIN: DELETE PRODUCT SHADE
// =====================================

app.delete(
  "/api/products/:productId/shades/:shadeId",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const shadeId = Number(req.params.shadeId);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(shadeId) ||
        shadeId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid product or shade ID."
        });
      }

      const shade = db.prepare(`
        SELECT shade_id
        FROM product_shades
        WHERE shade_id = ?
        AND product_id = ?
      `).get(shadeId, productId);

      if (!shade) {
        return res.status(404).json({
          message: "Shade not found."
        });
      }

      db.prepare(`
        DELETE FROM product_shades
        WHERE shade_id = ?
        AND product_id = ?
      `).run(shadeId, productId);

      res.json({
        message: "Shade deleted successfully!"
      });

    } catch (error) {
      console.error("Delete shade error:", error);

      res.status(500).json({
        message: "Unable to delete shade."
      });
    }
  }
);

// =====================================
// GET USER PROFILE
// =====================================

app.get("/api/profile", verifyToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT user_id, fullname, username, role, status
      FROM users
      WHERE user_id = ?
    `).get(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json(user);

  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      message: "Unable to load profile."
    });
  }
});
// =====================================
// ADMIN AND STAFF DASHBOARD
// =====================================

app.get("/api/dashboard", verifyToken, (req, res) => {
  try {

    // ALLOW ADMIN AND STAFF ONLY
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "Staff"
    ) {
      return res.status(403).json({
        message: "Admin and Staff access only."
      });
    }

    const totalProducts = db.prepare(`
      SELECT COUNT(*) AS total
      FROM products
    `).get().total;

    const totalCustomers = db.prepare(`
      SELECT COUNT(*) AS total
      FROM customers
    `).get().total;

    const totalOrders = db.prepare(`
      SELECT COUNT(*) AS total
      FROM orders
    `).get().total;

    const totalSales = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) AS total
      FROM payments
    `).get().total;

    res.json({
      totalProducts,
      totalCustomers,
      totalOrders,
      totalSales
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Unable to load dashboard."
    });
  }
});

// =====================================
// ADMIN REPORTS
// =====================================

app.get("/api/reports", verifyToken, verifyAdmin, (req, res) => {
  try {

    // TOTAL SALES
    const totalSales = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) AS total
      FROM payments
    `).get().total;

    // TOTAL ORDERS
    const totalOrders = db.prepare(`
      SELECT COUNT(*) AS total
      FROM orders
    `).get().total;

    // TOTAL CUSTOMERS
    const totalCustomers = db.prepare(`
      SELECT COUNT(*) AS total
      FROM customers
    `).get().total;

    // TOTAL PRODUCTS
    const totalProducts = db.prepare(`
      SELECT COUNT(*) AS total
      FROM products
    `).get().total;

    // MONTHLY SALES
    const monthlySales = db.prepare(`
      SELECT
        strftime('%Y-%m', payment_date) AS month,
        SUM(amount_paid) AS total_sales
      FROM payments
      WHERE payment_date IS NOT NULL
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month DESC
      LIMIT 6
    `).all().reverse();

    // TOP SELLING PRODUCTS
    const topProducts = db.prepare(`
      SELECT
        p.product_id,
        p.product_name,
        SUM(od.quantity) AS quantity_sold,
        SUM(od.subtotal) AS total_sales
      FROM order_details od
      JOIN products p
        ON od.product_id = p.product_id
      GROUP BY p.product_id, p.product_name
      ORDER BY quantity_sold DESC
      LIMIT 5
    `).all();

    // RECENT ORDERS
    const recentOrders = db.prepare(`
      SELECT
        o.order_id,
        c.customer_name,
        o.total_amount,
        o.order_date,
        o.status AS order_status
      FROM orders o
      LEFT JOIN customers c
        ON o.customer_id = c.customer_id
      ORDER BY o.order_id DESC
      LIMIT 10
    `).all();

    res.json({
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      monthlySales,
      topProducts,
      recentOrders
    });

  } catch (error) {

    console.error("Reports error:", error);

    res.status(500).json({
      message: "Unable to load reports."
    });

  }
});

// =====================================
// ADMIN: USER MANAGEMENT
// =====================================

// GET ALL USERS
app.get("/api/users", verifyToken, verifyAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT user_id, fullname, username, role, status
      FROM users
      WHERE role IN ('Admin', 'Staff')
      ORDER BY user_id DESC
    `).all();

    res.json(users);

  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Unable to load users."
    });
  }
});


// ADD USER
app.post("/api/users", verifyToken, verifyAdmin, (req, res) => {
  try {
    const { fullname, username, password, role } = req.body;

    if (
      !fullname?.trim() ||
      !username?.trim() ||
      !password ||
      !role
    ) {
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
      SELECT user_id
      FROM users
      WHERE username = ?
    `).get(username.trim());

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users
      (fullname, username, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      fullname.trim(),
      username.trim(),
      hashedPassword,
      role,
      "Active"
    );

    res.status(201).json({
      message: "User added successfully!",
      user_id: result.lastInsertRowid
    });

  } catch (error) {
    console.error("Add user error:", error);

    res.status(500).json({
      message: "Unable to add user."
    });
  }
});


// UPDATE USER
app.put("/api/users/:id", verifyToken, verifyAdmin, (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { fullname, username, password, role } = req.body;

    if (
      !fullname?.trim() ||
      !username?.trim() ||
      !role
    ) {
      return res.status(400).json({
        message: "Please complete all required fields."
      });
    }

    if (!["Admin", "Staff"].includes(role)) {
      return res.status(400).json({
        message: "Invalid user role."
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters."
      });
    }

    const existingUser = db.prepare(`
      SELECT user_id
      FROM users
      WHERE user_id = ?
    `).get(userId);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const duplicateUsername = db.prepare(`
      SELECT user_id
      FROM users
      WHERE username = ?
      AND user_id != ?
    `).get(username.trim(), userId);

    if (duplicateUsername) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.prepare(`
        UPDATE users
        SET fullname = ?,
            username = ?,
            password = ?,
            role = ?
        WHERE user_id = ?
      `).run(
        fullname.trim(),
        username.trim(),
        hashedPassword,
        role,
        userId
      );

    } else {
      db.prepare(`
        UPDATE users
        SET fullname = ?,
            username = ?,
            role = ?
        WHERE user_id = ?
      `).run(
        fullname.trim(),
        username.trim(),
        role,
        userId
      );
    }

    res.json({
      message: "User updated successfully!"
    });

  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Unable to update user."
    });
  }
});


// DELETE USER
app.delete("/api/users/:id", verifyToken, verifyAdmin, (req, res) => {
  try {
    const userId = Number(req.params.id);

    // Prevent deleting your own account
    if (userId === req.user.user_id) {
      return res.status(400).json({
        message: "You cannot delete your own account."
      });
    }

    const user = db.prepare(`
      SELECT user_id, role
      FROM users
      WHERE user_id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // Prevent deleting the last Admin
    if (user.role === "Admin") {
      const adminCount = db.prepare(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role = 'Admin'
      `).get().total;

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last Admin account."
        });
      }
    }

    db.prepare(`
      DELETE FROM users
      WHERE user_id = ?
    `).run(userId);

    res.json({
      message: "User deleted successfully!"
    });

  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Unable to delete user."
    });
  }
});
// =====================================
// CUSTOMER: GET AVAILABLE PRODUCTS
// =====================================

app.get(
  "/api/customer/products",
  verifyToken,
  verifyCustomer,
  (req, res) => {
    try {
      const products = db.prepare(`
        SELECT
          p.product_id,
          p.product_name,
          p.category_id,
          c.category_name,
          p.price,
          p.stock
        FROM products p
        LEFT JOIN categories c
          ON p.category_id = c.category_id
        WHERE p.stock > 0
          AND p.is_active = 1
          AND c.is_active = 1
        ORDER BY p.product_name ASC
      `).all();

      const getShades = db.prepare(`
        SELECT shade_id, shade_name
        FROM product_shades
        WHERE product_id = ?
        ORDER BY shade_name ASC
      `);

      const result = products.map(product => ({
        ...product,
        shades: getShades.all(product.product_id)
      }));

      res.json(result);

    } catch (error) {
      console.error("Customer products error:", error);

      res.status(500).json({
        message: "Unable to load products."
      });
    }
  }
);


// =====================================
// CUSTOMER: GET OWN ORDERS
// =====================================

app.get(
  "/api/customer/orders",
  verifyToken,
  verifyCustomer,
  (req, res) => {
    try {
      const customer = db.prepare(`
        SELECT customer_id
        FROM customers
        WHERE user_id = ?
      `).get(req.user.user_id);

      if (!customer) {
        return res.status(404).json({
          message: "Customer record not found."
        });
      }

      const orders = db.prepare(`
        SELECT
          order_id,
          order_date,
          total_amount,
          status
        FROM orders
        WHERE customer_id = ?
        ORDER BY order_id DESC
      `).all(customer.customer_id);

      const getOrderItems = db.prepare(`
        SELECT
          od.product_id,
          p.product_name,
          od.shade,
          od.quantity,
          od.price,
          od.subtotal
        FROM order_details od
        LEFT JOIN products p
          ON od.product_id = p.product_id
        WHERE od.order_id = ?
      `);

      const result = orders.map(order => ({
        ...order,
        items: getOrderItems.all(order.order_id)
      }));

      res.json(result);

    } catch (error) {
      console.error("Customer orders error:", error);

      res.status(500).json({
        message: "Unable to load your orders."
      });
    }
  }
);


// =====================================
// CUSTOMER: PLACE ORDER
// =====================================

app.post(
  "/api/customer/orders",
  verifyToken,
  verifyCustomer,
  (req, res) => {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message: "Your cart is empty."
        });
      }

      const customer = db.prepare(`
        SELECT customer_id
        FROM customers
        WHERE user_id = ?
      `).get(req.user.user_id);

      if (!customer) {
        return res.status(404).json({
          message: "Customer record not found."
        });
      }

      // COMBINE SAME PRODUCT AND SAME SHADE ONLY
      const combinedItems = {};

      for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);

        const shade = typeof item.shade === "string"
          ? item.shade.trim()
          : "";

        if (
          !Number.isInteger(productId) ||
          productId <= 0 ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          return res.status(400).json({
            message: "Invalid product or quantity."
          });
        }

        const itemKey = JSON.stringify([
          productId,
          shade
        ]);

        if (!combinedItems[itemKey]) {
          combinedItems[itemKey] = {
            product_id: productId,
            shade,
            quantity: 0
          };
        }

        combinedItems[itemKey].quantity += quantity;
      }

      const orderItems = [];
      let totalAmount = 0;

      const getProduct = db.prepare(`
        SELECT
          p.product_id,
          p.product_name,
          p.price,
          p.stock,
          c.category_name
        FROM products p
        LEFT JOIN categories c
          ON p.category_id = c.category_id
        WHERE p.product_id = ?
      `);

      const getProductShades = db.prepare(`
        SELECT shade_name
        FROM product_shades
        WHERE product_id = ?
      `);

      for (const item of Object.values(combinedItems)) {
        const product = getProduct.get(item.product_id);

        if (!product) {
          return res.status(404).json({
            message: "A selected product was not found."
          });
        }

        if (item.quantity > product.stock) {
          return res.status(400).json({
            message:
              `Not enough stock for ${product.product_name}. Available stock: ${product.stock}.`
          });
        }
// CHECK IF PRODUCT IS ALLOWED TO HAVE SHADES
const productName = product.product_name.toLowerCase();
const categoryName = (
  product.category_name || ""
).toLowerCase();

const canHaveShades =
  categoryName === "lip products" ||
  categoryName === "face makeup" ||
  productName.includes("lip tint") ||
  productName.includes("lip gloss") ||
  productName.includes("lipstick") ||
  productName.includes("lippie") ||
  productName.includes("blush") ||
  productName.includes("foundation") ||
  productName.includes("concealer");

// GET AVAILABLE SHADES
const availableShades = getProductShades.all(
  product.product_id
);

let selectedShade = null;

// VALIDATE SHADES ONLY FOR ALLOWED PRODUCTS
if (canHaveShades && availableShades.length > 0) {

  if (!item.shade) {
    return res.status(400).json({
      message:
        `Please select a shade for ${product.product_name}.`
    });
  }

  const matchingShade = availableShades.find(
    shade =>
      shade.shade_name.toLowerCase() ===
      item.shade.toLowerCase()
  );

  if (!matchingShade) {
    return res.status(400).json({
      message:
        `Invalid shade selected for ${product.product_name}.`
    });
  }

  selectedShade = matchingShade.shade_name;
}

        const subtotal = Number(product.price) * item.quantity;

        totalAmount += subtotal;

        orderItems.push({
          product_id: product.product_id,
          shade: selectedShade,
          quantity: item.quantity,
          price: Number(product.price),
          subtotal
        });
      }

      // SAVE ORDER AND ORDER DETAILS
      const createOrder = db.transaction(() => {

        const orderResult = db.prepare(`
          INSERT INTO orders
          (customer_id, total_amount, status)
          VALUES (?, ?, ?)
        `).run(
          customer.customer_id,
          totalAmount,
          "Pending"
        );

        const orderId = Number(orderResult.lastInsertRowid);

        const insertOrderItem = db.prepare(`
          INSERT INTO order_details
          (
            order_id,
            product_id,
            shade,
            quantity,
            price,
            subtotal
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of orderItems) {
          insertOrderItem.run(
            orderId,
            item.product_id,
            item.shade,
            item.quantity,
            item.price,
            item.subtotal
          );
        }

        return orderId;
      });

      const orderId = createOrder();

      res.status(201).json({
        message: "Order placed successfully!",
        order_id: orderId,
        total_amount: totalAmount,
        status: "Pending"
      });

    } catch (error) {
      console.error("Place order error:", error);

      res.status(500).json({
        message: "Unable to place your order."
      });
    }
  }
);

 // =====================================
 // ADMIN AND STAFF: GET ALL CUSTOMERS
 // =====================================

 app.get(
  "/api/customers",
  verifyToken,
  verifyAdminOrStaff,
  (req, res) => {
    try {
      const customers = db.prepare(`
        SELECT
          customer_id,
          customer_name,
          customer_name AS fullname,
          customer_name AS customer_name_display,
          contact_number,
          contact_number AS contact,
          address,
          user_id
        FROM customers
        ORDER BY customer_id DESC
      `).all();

      res.json(customers);

    } catch (error) {
      console.error("Customers error:", error);

      res.status(500).json({
        message: "Unable to load customers."
      });
    }
  }
);

// =====================================
// ADMIN: DELETE CUSTOMER
// =====================================

app.delete(
  "/api/customers/:id",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const customerId = Number(req.params.id);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        return res.status(400).json({
          message: "Invalid customer ID."
        });
      }

      const customer = db.prepare(`
        SELECT customer_id, user_id
        FROM customers
        WHERE customer_id = ?
      `).get(customerId);

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found."
        });
      }

      // CHECK IF CUSTOMER HAS EXISTING ORDERS
      const hasOrders = db.prepare(`
        SELECT order_id
        FROM orders
        WHERE customer_id = ?
        LIMIT 1
      `).get(customerId);

      if (hasOrders) {
        return res.status(400).json({
          message: "Cannot delete customer because they have existing order records."
        });
      }

      // DELETE CUSTOMER AND LINKED ACCOUNT
      const deleteCustomer = db.transaction(() => {

        db.prepare(`
          DELETE FROM customers
          WHERE customer_id = ?
        `).run(customerId);

        if (customer.user_id) {
          db.prepare(`
            DELETE FROM users
            WHERE user_id = ?
              AND role = 'Customer'
          `).run(customer.user_id);
        }

      });

      deleteCustomer();

      res.json({
        message: "Customer deleted successfully!"
      });

    } catch (error) {
      console.error("Delete customer error:", error);

      res.status(500).json({
        message: "Unable to delete customer."
      });
    }
  }
);
// =====================================
// ADMIN AND STAFF: GET ALL PRODUCTS
// =====================================

app.get(
  "/api/products",
  verifyToken,
  (req, res) => {
    try {

      // ALLOW ADMIN AND STAFF TO VIEW PRODUCTS
      if (
        req.user.role !== "Admin" &&
        req.user.role !== "Staff"
      ) {
        return res.status(403).json({
          message: "Admin and Staff access only."
        });
      }

      const products = db.prepare(`
        SELECT
          p.product_id,
          p.product_name,
          p.category_id,
          c.category_name,
          p.price,
          p.stock,
          p.stock AS stock_quantity
        FROM products p
        LEFT JOIN categories c
          ON p.category_id = c.category_id
        WHERE p.is_active = 1
          AND c.is_active = 1
        ORDER BY p.product_id DESC
      `).all();

      res.json(products);

    } catch (error) {
      console.error("Products error:", error);

      res.status(500).json({
        message: "Unable to load products."
      });
    }
  }
);

// =====================================
// ADMIN: UPDATE INVENTORY
// =====================================

app.post(
  "/api/inventory",
  verifyToken,
  verifyAdmin,
  (req, res) => {
    try {
      const {
        product_id,
        quantity,
        movement_type,
        remarks
      } = req.body;

      const productId = Number(product_id);
      const qty = Number(quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        return res.status(400).json({
          message: "Please enter a valid product and quantity."
        });
      }

      if (
        movement_type !== "Stock In" &&
        movement_type !== "Stock Out"
      ) {
        return res.status(400).json({
          message: "Invalid inventory movement type."
        });
      }

      const product = db.prepare(`
        SELECT product_id, product_name, stock
        FROM products
        WHERE product_id = ?
      `).get(productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      if (
        movement_type === "Stock Out" &&
        qty > product.stock
      ) {
        return res.status(400).json({
          message: "Not enough stock available."
        });
      }

      const updateInventory = db.transaction(() => {

        if (movement_type === "Stock In") {
          db.prepare(`
            UPDATE products
            SET stock = stock + ?
            WHERE product_id = ?
          `).run(qty, productId);
        } else {
          db.prepare(`
            UPDATE products
            SET stock = stock - ?
            WHERE product_id = ?
          `).run(qty, productId);
        }

        db.prepare(`
          INSERT INTO inventory (
            product_id,
            quantity,
            movement_type,
            remarks
          )
          VALUES (?, ?, ?, ?)
        `).run(
          productId,
          qty,
          movement_type === "Stock In" ? "IN" : "OUT",
          remarks || ""
        );

      });

      updateInventory();

      res.json({
        message: "Inventory updated successfully!"
      });

    } catch (error) {
      console.error("Update inventory error:", error);

      res.status(500).json({
        message: "Failed to update inventory."
      });
    }
  }
);

 // =====================================
 // ADMIN AND STAFF: GET ALL ORDERS
 // =====================================

 app.get(
  "/api/orders",
  verifyToken,
  verifyAdminOrStaff,
  (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT
          o.order_id,
          o.customer_id,
          c.customer_name AS customer_name,
          o.order_date,
          o.total_amount,
          o.status,
          o.status AS order_status
        FROM orders o
        LEFT JOIN customers c
          ON o.customer_id = c.customer_id
        ORDER BY o.order_id DESC
      `).all();

      res.json(orders);

    } catch (error) {
      console.error("Orders error:", error);

      res.status(500).json({
        message: "Unable to load orders."
      });
    }
  }
);

// =====================================
// ADMIN: CREATE ORDER WITH PAYMENT
// =====================================

app.post(
  "/api/orders",
  verifyToken,
  verifyAdminOrStaff,
  (req, res) => {
    try {
      const { customer_id, items, amount_paid } = req.body;

      const customerId = Number(customer_id);
      const paymentAmount = Number(amount_paid);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        return res.status(400).json({
          message: "Please select a valid customer."
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message: "Please add products to your cart."
        });
      }

      if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
        return res.status(400).json({
          message: "Invalid payment amount."
        });
      }

      const customer = db.prepare(`
        SELECT customer_id
        FROM customers
        WHERE customer_id = ?
      `).get(customerId);

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found."
        });
      }

      const combinedItems = {};

      for (const item of items) {
        const productId = Number(item.product_id);
        const itemQuantity = Number(item.quantity);

        if (
          !Number.isInteger(productId) ||
          productId <= 0 ||
          !Number.isInteger(itemQuantity) ||
          itemQuantity <= 0
        ) {
          return res.status(400).json({
            message: "Invalid product or quantity."
          });
        }

        combinedItems[productId] =
          (combinedItems[productId] || 0) + itemQuantity;
      }

      const orderItems = [];
      let totalAmount = 0;

      for (const productId of Object.keys(combinedItems)) {
        const itemQuantity = combinedItems[productId];

        const product = db.prepare(`
          SELECT product_id, product_name, price, stock
          FROM products
          WHERE product_id = ?
        `).get(Number(productId));

        if (!product) {
          return res.status(404).json({
            message: "A selected product was not found."
          });
        }

        if (itemQuantity > product.stock) {
          return res.status(400).json({
            message:
              `Not enough stock for ${product.product_name}. Available stock: ${product.stock}.`
          });
        }

        const subtotal = Number(product.price) * itemQuantity;

        totalAmount += subtotal;

        orderItems.push({
          product_id: product.product_id,
          quantity: itemQuantity,
          price: Number(product.price),
          subtotal
        });
      }

      if (paymentAmount < totalAmount) {
        return res.status(400).json({
          message: "Payment is not enough."
        });
      }

      const createOrder = db.transaction(() => {

        const orderResult = db.prepare(`
          INSERT INTO orders
          (customer_id, total_amount, status)
          VALUES (?, ?, ?)
        `).run(
          customerId,
          totalAmount,
          "Paid"
        );

        const orderId = Number(orderResult.lastInsertRowid);

        const insertOrderItem = db.prepare(`
          INSERT INTO order_details
          (order_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `);

        const updateStock = db.prepare(`
          UPDATE products
          SET stock = stock - ?
          WHERE product_id = ?
            AND stock >= ?
        `);

        const insertInventory = db.prepare(`
          INSERT INTO inventory
          (product_id, quantity, movement_type)
          VALUES (?, ?, 'OUT')
        `);

        for (const item of orderItems) {
          insertOrderItem.run(
            orderId,
            item.product_id,
            item.quantity,
            item.price,
            item.subtotal
          );

          const stockResult = updateStock.run(
            item.quantity,
            item.product_id,
            item.quantity
          );

          if (stockResult.changes === 0) {
            throw new Error(
              "Product stock changed. Please refresh and try again."
            );
          }

          insertInventory.run(
            item.product_id,
            item.quantity
          );
        }

        const changeAmount = paymentAmount - totalAmount;

        db.prepare(`
          INSERT INTO payments
          (order_id, amount_paid, change_amount, payment_method)
          VALUES (?, ?, ?, ?)
        `).run(
          orderId,
          totalAmount,
          changeAmount,
          "Cash"
        );

        return orderId;
      });

      const orderId = createOrder();

      res.status(201).json({
        message: "Order successfully processed!",
        order_id: orderId,
        total_amount: totalAmount,
        amount_paid: totalAmount,
        change: paymentAmount - totalAmount,
        status: "Paid"
      });

    } catch (error) {
      console.error("Create order error:", error);

      res.status(500).json({
        message: error.message || "Failed to process order."
      });
    }
  }
);

// =====================================
// ADMIN: GET ALL PAYMENT RECORDS
// =====================================

app.get(
    "/api/payments",
    verifyToken,
    verifyAdminOrStaff,
  (req, res) => {
    try {
      const payments = db.prepare(`
        SELECT
          p.payment_id,
          p.order_id,
          c.customer_name AS customer_name,
          p.amount_paid,
          p.change_amount,
          p.payment_method,
          p.payment_date
        FROM payments p
        LEFT JOIN orders o
          ON p.order_id = o.order_id
        LEFT JOIN customers c
          ON o.customer_id = c.customer_id
        ORDER BY p.payment_id DESC
      `).all();

      res.json(payments);

    } catch (error) {
      console.error("Load payments error:", error);

      res.status(500).json({
        message: "Unable to load payment records."
      });
    }
  }
);

// =====================================
// ADMIN: GET UNPAID ORDERS
// =====================================

app.get(
  "/api/payments/orders",
  verifyToken,
  verifyAdminOrStaff,
  (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT
          o.order_id,
          o.customer_id,
          c.customer_name AS customer_name,
          o.order_date,
          o.total_amount,
          o.status,
          COALESCE(
            (
              SELECT SUM(p.amount_paid)
              FROM payments p
              WHERE p.order_id = o.order_id
            ),
            0
          ) AS amount_paid_so_far
        FROM orders o
        LEFT JOIN customers c
          ON o.customer_id = c.customer_id
        WHERE o.status = 'Pending'
        ORDER BY o.order_id DESC
      `).all();

      res.json(orders);

    } catch (error) {
      console.error("Load unpaid orders error:", error);

      res.status(500).json({
        message: "Unable to load unpaid orders."
      });
    }
  }
);

// =====================================
// ADMIN: RECORD PAYMENT
// =====================================

app.post(
  "/api/payments",
  verifyToken,
  verifyAdminOrStaff,
  (req, res) => {
    try {
      const { order_id, amount_paid, payment_method } = req.body;

      const orderId = Number(order_id);
      const tenderedAmount = Number(amount_paid);

      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
          message: "Please select a valid order."
        });
      }

      if (
        !Number.isFinite(tenderedAmount) ||
        tenderedAmount <= 0
      ) {
        return res.status(400).json({
          message: "Please enter a valid payment amount."
        });
      }

      const allowedMethods = [
        "Cash",
        "GCash",
        "Bank Transfer"
      ];

      if (!allowedMethods.includes(payment_method)) {
        return res.status(400).json({
          message: "Invalid payment method."
        });
      }

      const processPayment = db.transaction(() => {

        const order = db.prepare(`
          SELECT order_id, total_amount, status
          FROM orders
          WHERE order_id = ?
        `).get(orderId);

        if (!order) {
          throw new Error("Order not found.");
        }

        if (order.status !== "Pending") {
          throw new Error(
            "This order has already been paid or processed."
          );
        }

        const previousPayments = db.prepare(`
          SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
          FROM payments
          WHERE order_id = ?
        `).get(orderId);

        const totalPaid = Number(previousPayments.total_paid);

        const remainingBalance =
          Number(order.total_amount) - totalPaid;

        if (remainingBalance <= 0) {
          throw new Error(
            "This order has already been fully paid."
          );
        }

        if (tenderedAmount < remainingBalance) {
          throw new Error(
            "Payment must cover the remaining balance of ₱" +
            remainingBalance.toFixed(2) + "."
          );
        }

        const changeAmount =
          tenderedAmount - remainingBalance;

        const items = db.prepare(`
          SELECT product_id, quantity, price
          FROM order_details
          WHERE order_id = ?
        `).all(orderId);

        if (items.length === 0) {
          throw new Error("This order has no products.");
        }

        for (const item of items) {
          const product = db.prepare(`
            SELECT product_name, stock
            FROM products
            WHERE product_id = ?
          `).get(item.product_id);

          if (!product) {
            throw new Error(
              "A product in this order no longer exists."
            );
          }

          if (Number(item.quantity) > Number(product.stock)) {
            throw new Error(
              `Not enough stock for ${product.product_name}. Available stock: ${product.stock}.`
            );
          }
        }

        db.prepare(`
          INSERT INTO payments
          (
            order_id,
            amount_paid,
            change_amount,
            payment_method
          )
          VALUES (?, ?, ?, ?)
        `).run(
          orderId,
          remainingBalance,
          changeAmount,
          payment_method
        );

        const updateStock = db.prepare(`
          UPDATE products
          SET stock = stock - ?
          WHERE product_id = ?
            AND stock >= ?
        `);

        const insertInventory = db.prepare(`
          INSERT INTO inventory
          (product_id, quantity, movement_type)
          VALUES (?, ?, 'OUT')
        `);

        for (const item of items) {
          const result = updateStock.run(
            item.quantity,
            item.product_id,
            item.quantity
          );

          if (result.changes === 0) {
            throw new Error(
              "Stock changed while processing. Please try again."
            );
          }

          insertInventory.run(
            item.product_id,
            item.quantity
          );
        }

        db.prepare(`
          UPDATE orders
          SET status = 'Paid'
          WHERE order_id = ?
            AND status = 'Pending'
        `).run(orderId);

        return {
          remainingBalance,
          changeAmount
        };
      });

      const result = processPayment();

      res.json({
        message: "Payment recorded successfully!",
        order_id: orderId,
        amount_paid: result.remainingBalance,
        change_amount: result.changeAmount,
        status: "Paid"
      });

    } catch (error) {
      console.error("Record payment error:", error);

      res.status(400).json({
        message: error.message || "Unable to record payment."
      });
    }
  }
);

// =====================================
// START SERVER
// =====================================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running at http://localhost:${PORT}`
  );
});
