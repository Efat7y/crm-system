const db = require("../db")

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ""
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const token = authHeader.slice("Bearer ".length).trim()
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const [rows] = await db.query(
      `
      SELECT
        us.id AS session_id,
        us.user_id,
        us.expires_at,
        u.name,
        u.email,
        u.role,
        u.customer_id
      FROM user_sessions us
      INNER JOIN users u ON u.id = us.user_id
      WHERE us.token = ? AND us.expires_at > NOW()
      LIMIT 1
      `,
      [token]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: "Session expired or invalid" })
    }

    req.auth = {
      sessionId: rows[0].session_id,
      userId: rows[0].user_id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
      customerId: rows[0].customer_id,
      token
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth || req.auth.role !== role) {
      return res.status(403).json({ message: "Forbidden" })
    }
    return next()
  }
}

module.exports = {
  requireAuth,
  requireRole
}
