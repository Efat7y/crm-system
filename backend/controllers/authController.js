const db = require("../db")
const { generateToken, hashPassword, verifyPassword } = require("../utils/security")

function normalizeText(value) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return parsed
}

async function registerCustomer(req, res, next) {
  try {
    const name = normalizeText(req.body.name)
    const email = normalizeText(req.body.email)
    const phone = normalizeText(req.body.phone)
    const password = normalizeText(req.body.password)

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" })
    }

    const [exists] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email])
    if (exists.length > 0) {
      return res.status(409).json({ message: "Email already registered" })
    }

    const [customerResult] = await db.query(
      `
      INSERT INTO customers (name, email, phone)
      VALUES (?, ?, ?)
      `,
      [name, email, phone]
    )

    const passwordHash = hashPassword(password)
    const customerId = customerResult.insertId

    const [userResult] = await db.query(
      `
      INSERT INTO users (name, email, password_hash, role, customer_id)
      VALUES (?, ?, ?, 'customer', ?)
      `,
      [name, email, passwordHash, customerId]
    )

    return res.status(201).json({
      id: userResult.insertId,
      name,
      email,
      role: "customer",
      customer_id: customerId
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" })
    }
    return next(error)
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeText(req.body.email)
    const password = normalizeText(req.body.password)
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" })
    }

    const [users] = await db.query(
      `
      SELECT id, name, email, password_hash, role, customer_id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    )

    if (users.length === 0 || !verifyPassword(password, users[0].password_hash)) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const user = users[0]
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.query(
      `
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
      `,
      [user.id, token, expiresAt]
    )

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customer_id: user.customer_id
      }
    })
  } catch (error) {
    return next(error)
  }
}

async function me(req, res, next) {
  try {
    return res.json({
      id: req.auth.userId,
      name: req.auth.name,
      email: req.auth.email,
      role: req.auth.role,
      customer_id: req.auth.customerId
    })
  } catch (error) {
    return next(error)
  }
}

async function logout(req, res, next) {
  try {
    const sessionId = parsePositiveInt(req.auth?.sessionId)
    if (!sessionId) {
      return res.status(400).json({ message: "Invalid session" })
    }
    await db.query("DELETE FROM user_sessions WHERE id = ?", [sessionId])
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  registerCustomer,
  login,
  me,
  logout
}
