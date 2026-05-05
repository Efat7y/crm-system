const express = require("express")
const cors = require("cors")
const db = require("./db")
const customersRoutes = require("./routes/customers")
const catalogsRoutes = require("./routes/catalogs")
const dashboardRoutes = require("./routes/dashboard")
const authRoutes = require("./routes/auth")
const shopRoutes = require("./routes/shop")
const { hashPassword } = require("./utils/security")
const { requireAuth, requireRole } = require("./middleware/auth")

const app = express()
const PORT = Number.parseInt(process.env.PORT || "5000", 10)

function logDatabaseBootstrapError(error) {
  if (error.code === "ECONNREFUSED") {
    console.error(
      `Failed to initialize server: Unable to reach MySQL at ${db.connectionInfo.host}:${db.connectionInfo.port}. ` +
      "Start MySQL/MariaDB or update DB_HOST/DB_PORT."
    )
    return
  }

  if (error.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("Failed to initialize server: Invalid MySQL credentials. Check DB_USER and DB_PASSWORD.")
    return
  }

  console.error("Failed to initialize server:", error)
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [tableName, columnName]
  )

  if (Number(rows[0]?.total || 0) === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
  }
}

async function ensureSchema() {
  await db.ensureDatabaseExists()

  await db.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NULL,
      phone VARCHAR(30) NULL,
      company VARCHAR(120) NULL,
      address VARCHAR(255) NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_customers_email (email),
      KEY idx_customers_name (name),
      KEY idx_customers_phone (phone)
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
      customer_id INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_users_email (email),
      KEY idx_users_role (role),
      CONSTRAINT fk_users_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE SET NULL
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      token VARCHAR(128) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_sessions_token (token),
      KEY idx_user_sessions_user_id (user_id),
      KEY idx_user_sessions_expires_at (expires_at),
      CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id INT UNSIGNED NOT NULL,
      item_name VARCHAR(120) NOT NULL,
      category ENUM('fragrance', 'raw_material', 'color') NOT NULL DEFAULT 'raw_material',
      quantity DECIMAL(10, 2) NOT NULL,
      unit VARCHAR(30) NULL,
      unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_items_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE CASCADE,
      KEY idx_customer_items_customer_id (customer_id),
      KEY idx_customer_items_created_at (created_at)
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_payments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id INT UNSIGNED NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      payment_method VARCHAR(50) NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_payments_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE CASCADE,
      KEY idx_customer_payments_customer_id (customer_id),
      KEY idx_customer_payments_created_at (created_at)
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS catalog_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      category ENUM('fragrance', 'raw_material', 'color') NOT NULL,
      default_unit VARCHAR(30) NULL,
      default_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_catalog_items_category_name (category, name),
      KEY idx_catalog_items_category (category),
      KEY idx_catalog_items_name (name)
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS site_updates (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_orders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id INT UNSIGNED NOT NULL,
      product_name VARCHAR(150) NOT NULL,
      category ENUM('fragrance', 'raw_material', 'color') NOT NULL,
      quantity DECIMAL(10, 2) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      notes TEXT NULL,
      status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
      approved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE CASCADE,
      KEY idx_customer_orders_customer_id (customer_id),
      KEY idx_customer_orders_status (status),
      KEY idx_customer_orders_created_at (created_at)
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_order_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      product_name VARCHAR(150) NOT NULL,
      category ENUM('fragrance', 'raw_material', 'color') NOT NULL,
      quantity DECIMAL(10, 2) NOT NULL,
      unit VARCHAR(30) NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_customer_order_items_order
        FOREIGN KEY (order_id) REFERENCES customer_orders(id)
        ON DELETE CASCADE,
      KEY idx_customer_order_items_order_id (order_id),
      KEY idx_customer_order_items_created_at (created_at)
    )
  `)

  // Keep enum categories in sync for existing databases.
  await db.query("ALTER TABLE catalog_items MODIFY category ENUM('fragrance', 'raw_material', 'color') NOT NULL")
  await db.query(
    "ALTER TABLE customer_items MODIFY category ENUM('fragrance', 'raw_material', 'color') NOT NULL DEFAULT 'raw_material'"
  )
  await db.query("ALTER TABLE customer_orders MODIFY category ENUM('fragrance', 'raw_material', 'color') NOT NULL")
  await db.query("ALTER TABLE customer_order_items MODIFY category ENUM('fragrance', 'raw_material', 'color') NOT NULL")
  await addColumnIfMissing("customer_orders", "approved_at", "DATETIME NULL AFTER status")
  await db.query(
    "UPDATE customer_orders SET approved_at = created_at WHERE status IN ('approved', 'completed') AND approved_at IS NULL"
  )
  await db.query(`
    INSERT INTO customer_order_items (order_id, product_name, category, quantity, unit, unit_price, total_amount)
    SELECT
      o.id,
      o.product_name,
      o.category,
      o.quantity,
      ci.default_unit AS unit,
      o.unit_price,
      o.total_amount
    FROM customer_orders o
    LEFT JOIN catalog_items ci ON ci.name = o.product_name AND ci.category = o.category
    WHERE NOT EXISTS (
      SELECT 1
      FROM customer_order_items oi
      WHERE oi.order_id = o.id
    )
  `)

  const defaultRawMaterials = [
    ["تكسابون", "raw_material", "كجم", 0, "مادة فعالة للتنظيف والرغوة"],
    ["تايلوز", "raw_material", "كجم", 0, "مادة للتكثيف والقوام"],
    ["سلفونيك", "raw_material", "كجم", 0, "حمض سلفونيك للمنظفات"],
    ["صودا كاوية", "raw_material", "كجم", 0, "للمعادلة وضبط التفاعل"],
    ["ملح", "raw_material", "كجم", 0, "لضبط اللزوجة"],
    ["جلسرين", "raw_material", "كجم", 0, "مرطب ومحسن للملمس"],
    ["مادة حافظة", "raw_material", "كجم", 0, "لزيادة الثبات"],
    ["EDTA", "raw_material", "كجم", 0, "عامل مخلب"],
    ["لون", "raw_material", "جرام", 0, "ملون منتج"]
  ]

  const defaultFragrances = [
    ["ليمون", "fragrance", "لتر", 0, "رائحة حمضية منعشة"],
    ["خوخ", "fragrance", "لتر", 0, "رائحة فواكه"],
    ["رومبا", "fragrance", "لتر", 0, "رائحة عطرية مميزة"],
    ["لافندر", "fragrance", "لتر", 0, "رائحة هادئة"],
    ["تفاح", "fragrance", "لتر", 0, "رائحة فواكه"],
    ["فانيليا", "fragrance", "لتر", 0, "رائحة حلوة"]
  ]

  const defaultColors = [
    ["Blue Color", "color", "gram", 0, "Color additive"],
    ["Green Color", "color", "gram", 0, "Color additive"],
    ["Yellow Color", "color", "gram", 0, "Color additive"],
    ["Red Color", "color", "gram", 0, "Color additive"],
    ["Violet Color", "color", "gram", 0, "Color additive"]
  ]

  for (const [name, category, defaultUnit, defaultPrice, notes] of [
    ...defaultRawMaterials,
    ...defaultFragrances,
    ...defaultColors
  ]) {
    await db.query(
      `
      INSERT IGNORE INTO catalog_items (name, category, default_unit, default_price, notes)
      VALUES (?, ?, ?, ?, ?)
      `,
      [name, category, defaultUnit, defaultPrice, notes]
    )
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@crm.local"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
  const adminName = process.env.ADMIN_NAME || "System Admin"

  const [admins] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [adminEmail])
  if (admins.length === 0) {
    await db.query(
      `
      INSERT INTO users (name, email, password_hash, role, customer_id)
      VALUES (?, ?, ?, 'admin', NULL)
      `,
      [adminName, adminEmail, hashPassword(adminPassword)]
    )
    console.log(`Default admin created: ${adminEmail} / ${adminPassword}`)
  }

  console.log("Database schema is ready")
}

const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000"

app.use(
  cors({
    origin: allowedOrigin
  })
)
app.use(express.json())

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/auth", authRoutes)
app.use("/api/shop", shopRoutes)

app.use("/api/customers", requireAuth, requireRole("admin"), customersRoutes)
app.use("/api/catalogs", requireAuth, requireRole("admin"), catalogsRoutes)
app.use("/api/dashboard", requireAuth, requireRole("admin"), dashboardRoutes)

app.get("/", (req, res) => {
  res.json({
    message: "CRM API is running",
    health: "/api/health"
  })
})

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" })
})

app.use((error, req, res, next) => {
  console.error("Unhandled Error:", error)
  res.status(500).json({ message: "Internal server error" })
})

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    logDatabaseBootstrapError(error)
    process.exit(1)
  })
