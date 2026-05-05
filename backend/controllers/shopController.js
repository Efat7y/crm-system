const db = require("../db")
const { mapOrderItemRow, mapOrderRow } = require("../utils/orders")

function normalizeText(value) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

function parsePositiveNumber(value) {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return parsed
}

function parseNonNegativeNumber(value) {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return parsed
}

function normalizeCategory(value) {
  const category = normalizeText(value)
  if (!category) return null
  if (["raw_material", "fragrance", "color"].includes(category)) return category
  return null
}

function buildOrderItemKey(item) {
  return `${item.category}::${item.product_name}::${item.unit_price}`
}

function validateOrderItemsPayload(body) {
  const rawItems = Array.isArray(body.items) && body.items.length ? body.items : [body]
  const items = []

  for (const rawItem of rawItems) {
    const productName = normalizeText(rawItem?.product_name)
    const category = normalizeCategory(rawItem?.category)
    const quantity = parsePositiveNumber(rawItem?.quantity)
    const unitPrice = parseNonNegativeNumber(rawItem?.unit_price)

    if (!productName || !category || !quantity || unitPrice === null) {
      return { error: "Each item requires product_name, category, quantity and unit_price" }
    }

    items.push({
      product_name: productName,
      category,
      quantity,
      unit_price: unitPrice
    })
  }

  if (!items.length) {
    return { error: "At least one order item is required" }
  }

  return { items }
}

function mergeOrderItems(items) {
  const merged = new Map()

  for (const item of items) {
    const key = buildOrderItemKey(item)
    const existing = merged.get(key)

    if (!existing) {
      merged.set(key, { ...item })
      continue
    }

    existing.quantity = Number((existing.quantity + item.quantity).toFixed(2))
  }

  return Array.from(merged.values())
}

async function findCatalogUnits(connection, items) {
  const uniquePairs = Array.from(
    new Map(items.map((item) => [`${item.category}::${item.product_name}`, item])).values()
  )

  if (!uniquePairs.length) return new Map()

  const conditions = uniquePairs.map(() => "(name = ? AND category = ?)").join(" OR ")
  const params = uniquePairs.flatMap((item) => [item.product_name, item.category])
  const [rows] = await connection.query(
    `
    SELECT name, category, default_unit
    FROM catalog_items
    WHERE ${conditions}
    `,
    params
  )

  return new Map(rows.map((row) => [`${row.category}::${row.name}`, row.default_unit || null]))
}

async function getOrderItems(orderId, connection = db) {
  const [rows] = await connection.query(
    `
    SELECT id, order_id, product_name, category, quantity, unit, unit_price, total_amount
    FROM customer_order_items
    WHERE order_id = ?
    ORDER BY id ASC
    `,
    [orderId]
  )

  return rows.map(mapOrderItemRow).filter(Boolean)
}

async function findOrderBaseRow(orderId, customerId = null, connection = db) {
  const params = [orderId]
  let whereClause = "WHERE o.id = ?"

  if (customerId) {
    whereClause += " AND o.customer_id = ?"
    params.push(customerId)
  }

  const [rows] = await connection.query(
    `
    SELECT
      o.id,
      o.customer_id,
      c.name AS customer_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      c.company AS customer_company,
      c.address AS customer_address,
      o.product_name,
      o.category,
      o.quantity,
      o.unit_price,
      o.total_amount,
      o.notes,
      o.status,
      o.created_at,
      o.approved_at,
      COUNT(oi.id) AS items_count,
      GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ' | ') AS products_summary
    FROM customer_orders o
    INNER JOIN customers c ON c.id = o.customer_id
    LEFT JOIN customer_order_items oi ON oi.order_id = o.id
    ${whereClause}
    GROUP BY
      o.id,
      o.customer_id,
      c.name,
      c.email,
      c.phone,
      c.company,
      c.address,
      o.product_name,
      o.category,
      o.quantity,
      o.unit_price,
      o.total_amount,
      o.notes,
      o.status,
      o.created_at,
      o.approved_at
    LIMIT 1
    `,
    params
  )

  return rows[0] || null
}

async function findOrderById(orderId, customerId = null, connection = db) {
  const row = await findOrderBaseRow(orderId, customerId, connection)
  if (!row) return null

  const items = await getOrderItems(orderId, connection)
  return mapOrderRow({ ...row, items })
}

async function listOrderRows({ customerId = null, includeCustomer = false } = {}, connection = db) {
  const params = []
  const customerFields = includeCustomer ? "c.name AS customer_name," : ""
  const joinCustomer = includeCustomer ? "INNER JOIN customers c ON c.id = o.customer_id" : ""
  let whereClause = ""

  if (customerId) {
    whereClause = "WHERE o.customer_id = ?"
    params.push(customerId)
  }

  const [rows] = await connection.query(
    `
    SELECT
      o.id,
      o.customer_id,
      ${customerFields}
      o.product_name,
      o.category,
      o.quantity,
      o.unit_price,
      o.total_amount,
      o.notes,
      o.status,
      o.created_at,
      o.approved_at,
      COUNT(oi.id) AS items_count,
      GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ' | ') AS products_summary
    FROM customer_orders o
    ${joinCustomer}
    LEFT JOIN customer_order_items oi ON oi.order_id = o.id
    ${whereClause}
    GROUP BY
      o.id,
      o.customer_id,
      ${includeCustomer ? "c.name," : ""}
      o.product_name,
      o.category,
      o.quantity,
      o.unit_price,
      o.total_amount,
      o.notes,
      o.status,
      o.created_at,
      o.approved_at
    ORDER BY o.id DESC
    `,
    params
  )

  return rows.map(mapOrderRow)
}

async function getPublicCatalog(req, res, next) {
  try {
    const [rows] = await db.query(
      `
      SELECT id, name, category, default_unit, default_price
      FROM catalog_items
      ORDER BY category ASC, name ASC
      `
    )
    return res.json({
      raw_materials: rows.filter((item) => item.category === "raw_material"),
      fragrances: rows.filter((item) => item.category === "fragrance"),
      colors: rows.filter((item) => item.category === "color")
    })
  } catch (error) {
    return next(error)
  }
}

async function listUpdates(req, res, next) {
  try {
    const [rows] = await db.query(
      `
      SELECT id, title, content, created_at
      FROM site_updates
      ORDER BY created_at DESC
      LIMIT 50
      `
    )
    return res.json(rows)
  } catch (error) {
    return next(error)
  }
}

async function createUpdate(req, res, next) {
  try {
    const title = normalizeText(req.body.title)
    const content = normalizeText(req.body.content)
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" })
    }

    const [result] = await db.query(
      `
      INSERT INTO site_updates (title, content)
      VALUES (?, ?)
      `,
      [title, content]
    )

    return res.status(201).json({
      id: result.insertId,
      title,
      content
    })
  } catch (error) {
    return next(error)
  }
}

async function deleteUpdate(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10)
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid update id" })
    }

    const [result] = await db.query("DELETE FROM site_updates WHERE id = ?", [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Update not found" })
    }
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

async function createOrder(req, res, next) {
  const connection = await db.getConnection()
  let transactionStarted = false

  try {
    const customerId = req.auth.customerId
    if (!customerId) {
      return res.status(400).json({ message: "Customer profile not found" })
    }

    const validation = validateOrderItemsPayload(req.body || {})
    if (validation.error) {
      return res.status(400).json({ message: validation.error })
    }

    const notes = normalizeText(req.body.notes)
    const mergedItems = mergeOrderItems(validation.items)
    const unitsByKey = await findCatalogUnits(connection, mergedItems)
    const orderItems = mergedItems.map((item) => {
      const unit = unitsByKey.get(`${item.category}::${item.product_name}`) || null
      const totalAmount = Number((item.quantity * item.unit_price).toFixed(2))

      return {
        ...item,
        unit,
        total_amount: totalAmount
      }
    })

    const totalAmount = Number(orderItems.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2))
    const primaryItem = orderItems[0]

    await connection.beginTransaction()
    transactionStarted = true

    const [result] = await connection.query(
      `
      INSERT INTO customer_orders (customer_id, product_name, category, quantity, unit_price, total_amount, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        customerId,
        primaryItem.product_name,
        primaryItem.category,
        primaryItem.quantity,
        primaryItem.unit_price,
        totalAmount,
        notes
      ]
    )

    const orderId = result.insertId
    const placeholders = orderItems.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ")
    const itemParams = orderItems.flatMap((item) => [
      orderId,
      item.product_name,
      item.category,
      item.quantity,
      item.unit,
      item.unit_price,
      item.total_amount
    ])

    await connection.query(
      `
      INSERT INTO customer_order_items (order_id, product_name, category, quantity, unit, unit_price, total_amount)
      VALUES ${placeholders}
      `,
      itemParams
    )

    await connection.commit()

    const order = await findOrderById(orderId, customerId, connection)
    return res.status(201).json(order)
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback()
    }
    return next(error)
  } finally {
    connection.release()
  }
}

async function listMyOrders(req, res, next) {
  try {
    const customerId = req.auth.customerId
    const orders = await listOrderRows({ customerId })
    return res.json(orders)
  } catch (error) {
    return next(error)
  }
}

async function listAllOrders(req, res, next) {
  try {
    const orders = await listOrderRows({ includeCustomer: true })
    return res.json(orders)
  } catch (error) {
    return next(error)
  }
}

async function getMyOrderById(req, res, next) {
  try {
    const orderId = parsePositiveInt(req.params.id)
    const customerId = req.auth.customerId
    if (!orderId || !customerId) {
      return res.status(400).json({ message: "Invalid order id" })
    }

    const order = await findOrderById(orderId, customerId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    return res.json(order)
  } catch (error) {
    return next(error)
  }
}

async function getOrderById(req, res, next) {
  try {
    const orderId = parsePositiveInt(req.params.id)
    if (!orderId) {
      return res.status(400).json({ message: "Invalid order id" })
    }

    const order = await findOrderById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    return res.json(order)
  } catch (error) {
    return next(error)
  }
}

async function getMyOrderInvoice(req, res, next) {
  try {
    const orderId = parsePositiveInt(req.params.id)
    const customerId = req.auth.customerId
    if (!orderId || !customerId) {
      return res.status(400).json({ message: "Invalid order id" })
    }

    const order = await findOrderById(orderId, customerId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (!order.invoice_ready) {
      return res.status(409).json({ message: "Invoice is not available until the order is approved" })
    }

    return res.json(order)
  } catch (error) {
    return next(error)
  }
}

async function getOrderInvoice(req, res, next) {
  try {
    const orderId = parsePositiveInt(req.params.id)
    if (!orderId) {
      return res.status(400).json({ message: "Invalid order id" })
    }

    const order = await findOrderById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (!order.invoice_ready) {
      return res.status(409).json({ message: "Invoice is not available until the order is approved" })
    }

    return res.json(order)
  } catch (error) {
    return next(error)
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10)
    const status = normalizeText(req.body.status)
    if (Number.isNaN(id) || id <= 0 || !status) {
      return res.status(400).json({ message: "Invalid order id or status" })
    }

    if (!["pending", "approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" })
    }

    const [orders] = await db.query("SELECT id, approved_at FROM customer_orders WHERE id = ? LIMIT 1", [id])
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" })
    }

    let approvedAt = orders[0].approved_at

    if (status === "approved" && !approvedAt) {
      approvedAt = new Date()
    }

    if (status === "pending" || status === "rejected") {
      approvedAt = null
    }

    await db.query("UPDATE customer_orders SET status = ?, approved_at = ? WHERE id = ?", [status, approvedAt, id])

    const order = await findOrderById(id)
    return res.json(order)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getPublicCatalog,
  listUpdates,
  createUpdate,
  deleteUpdate,
  createOrder,
  listMyOrders,
  listAllOrders,
  getMyOrderById,
  getOrderById,
  getMyOrderInvoice,
  getOrderInvoice,
  updateOrderStatus
}
