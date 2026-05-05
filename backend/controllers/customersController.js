const db = require("../db")
const { mapOrderRow } = require("../utils/orders")

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function parsePositiveNumber(value) {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function parseNonNegativeNumber(value) {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function validateCustomerPayload(body) {
  const name = normalizeText(body.name)
  if (!name) {
    return { error: "name is required" }
  }

  return {
    data: {
      name,
      email: normalizeText(body.email),
      phone: normalizeText(body.phone),
      company: normalizeText(body.company),
      address: normalizeText(body.address),
      notes: normalizeText(body.notes)
    }
  }
}

function validateItemPayload(body) {
  const itemName = normalizeText(body.item_name)
  if (!itemName) {
    return { error: "item_name is required" }
  }

  const category = normalizeText(body.category) || "raw_material"
  if (!["fragrance", "raw_material", "color"].includes(category)) {
    return { error: "category must be fragrance, raw_material or color" }
  }

  const quantity = parsePositiveNumber(body.quantity)
  if (quantity === null) {
    return { error: "quantity must be greater than zero" }
  }

  const unitPrice = parseNonNegativeNumber(body.unit_price)
  if (unitPrice === null) {
    return { error: "unit_price must be zero or greater" }
  }

  return {
    data: {
      item_name: itemName,
      category,
      quantity,
      unit: normalizeText(body.unit),
      unit_price: unitPrice,
      notes: normalizeText(body.notes)
    }
  }
}

function validatePaymentPayload(body) {
  const amount = parsePositiveNumber(body.amount)
  if (amount === null) {
    return { error: "amount must be greater than zero" }
  }

  return {
    data: {
      amount,
      payment_method: normalizeText(body.payment_method),
      notes: normalizeText(body.notes)
    }
  }
}

function toNumber(value) {
  return Number(value || 0)
}

function buildCustomerTransactions({ orders, items, payments }) {
  return [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      entry_id: order.id,
      movement_type: "order",
      title: order.products_summary || order.product_name,
      amount: order.total_amount,
      status: order.status,
      invoice_number: order.invoice_number,
      invoice_ready: order.invoice_ready,
      created_at: order.created_at,
      approved_at: order.approved_at
    })),
    ...items.map((item) => ({
      id: `item-${item.id}`,
      entry_id: item.id,
      movement_type: "item",
      title: item.item_name,
      amount: Number(item.total_amount || 0),
      status: "recorded",
      created_at: item.created_at
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      entry_id: payment.id,
      movement_type: "payment",
      title: payment.payment_method || "Payment",
      amount: Number(payment.amount || 0),
      status: "completed",
      created_at: payment.created_at
    }))
  ].sort((left, right) => {
    const rightTime = new Date(right.created_at || 0).getTime()
    const leftTime = new Date(left.created_at || 0).getTime()

    if (rightTime !== leftTime) {
      return rightTime - leftTime
    }

    return Number(right.entry_id || 0) - Number(left.entry_id || 0)
  })
}

async function getCustomerSummary(customerId) {
  const [summaryRows] = await db.query(
    `
      SELECT
        COALESCE(items.total_items_amount, 0) AS manual_items_amount,
        COALESCE(orders.total_orders_amount, 0) AS approved_orders_amount,
        COALESCE(pending.pending_orders_amount, 0) AS pending_orders_amount,
        COALESCE(payments.total_paid_amount, 0) AS total_paid_amount,
        COALESCE(order_counts.total_orders_count, 0) AS total_orders_count,
        COALESCE(order_counts.billable_orders_count, 0) AS billable_orders_count,
        COALESCE(order_counts.pending_orders_count, 0) AS pending_orders_count
      FROM (SELECT ? AS customer_id) seed
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS total_items_amount
        FROM customer_items
        GROUP BY customer_id
      ) items ON items.customer_id = seed.customer_id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS total_orders_amount
        FROM customer_orders
        WHERE status IN ('approved', 'completed')
        GROUP BY customer_id
      ) orders ON orders.customer_id = seed.customer_id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS pending_orders_amount
        FROM customer_orders
        WHERE status = 'pending'
        GROUP BY customer_id
      ) pending ON pending.customer_id = seed.customer_id
      LEFT JOIN (
        SELECT customer_id, SUM(amount) AS total_paid_amount
        FROM customer_payments
        GROUP BY customer_id
      ) payments ON payments.customer_id = seed.customer_id
      LEFT JOIN (
        SELECT
          customer_id,
          COUNT(*) AS total_orders_count,
          SUM(CASE WHEN status IN ('approved', 'completed') THEN 1 ELSE 0 END) AS billable_orders_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders_count
        FROM customer_orders
        GROUP BY customer_id
      ) order_counts ON order_counts.customer_id = seed.customer_id
    `,
    [customerId]
  )

  const summary = summaryRows[0] || {}
  const manualItems = toNumber(summary.manual_items_amount)
  const approvedOrders = toNumber(summary.approved_orders_amount)
  const pendingOrders = toNumber(summary.pending_orders_amount)
  const totalPaid = toNumber(summary.total_paid_amount)
  const totalCharges = Number((manualItems + approvedOrders).toFixed(2))
  const rawBalance = Number((totalCharges - totalPaid).toFixed(2))

  return {
    total_items_amount: manualItems,
    manual_items_amount: manualItems,
    approved_orders_amount: approvedOrders,
    pending_orders_amount: pendingOrders,
    total_paid_amount: totalPaid,
    total_charges_amount: totalCharges,
    balance_due: Math.max(rawBalance, 0),
    credit_balance: Math.max(rawBalance * -1, 0),
    total_orders_count: Number(summary.total_orders_count || 0),
    billable_orders_count: Number(summary.billable_orders_count || 0),
    pending_orders_count: Number(summary.pending_orders_count || 0)
  }
}

async function ensureCustomerExists(customerId) {
  const [rows] = await db.query("SELECT id FROM customers WHERE id = ?", [customerId])
  return rows.length > 0
}

async function listCustomers(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100)
    const offset = (page - 1) * limit
    const search = (req.query.search || "").toString().trim()
    const searchLike = `%${search}%`

    let rowsQuery = `
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.company,
        c.address,
        c.notes,
        c.created_at,
        c.updated_at,
        COALESCE(items.total_items_amount, 0) AS total_items_amount,
        COALESCE(orders.approved_orders_amount, 0) AS approved_orders_amount,
        COALESCE(pending.pending_orders_amount, 0) AS pending_orders_amount,
        COALESCE(payments.total_paid_amount, 0) AS total_paid_amount,
        COALESCE(order_counts.total_orders_count, 0) AS total_orders_count,
        (
          COALESCE(items.total_items_amount, 0) +
          COALESCE(orders.approved_orders_amount, 0)
        ) AS total_charges_amount,
        GREATEST(
          (
            COALESCE(items.total_items_amount, 0) +
            COALESCE(orders.approved_orders_amount, 0)
          ) - COALESCE(payments.total_paid_amount, 0),
          0
        ) AS balance_due
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS total_items_amount
        FROM customer_items
        GROUP BY customer_id
      ) items ON items.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS approved_orders_amount
        FROM customer_orders
        WHERE status IN ('approved', 'completed')
        GROUP BY customer_id
      ) orders ON orders.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS pending_orders_amount
        FROM customer_orders
        WHERE status = 'pending'
        GROUP BY customer_id
      ) pending ON pending.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, SUM(amount) AS total_paid_amount
        FROM customer_payments
        GROUP BY customer_id
      ) payments ON payments.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, COUNT(*) AS total_orders_count
        FROM customer_orders
        GROUP BY customer_id
      ) order_counts ON order_counts.customer_id = c.id
    `
    let countQuery = "SELECT COUNT(*) AS total FROM customers"
    let params = []

    if (search) {
      rowsQuery += " WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company LIKE ?"
      countQuery += " WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?"
      params = [searchLike, searchLike, searchLike, searchLike]
    }

    rowsQuery += " ORDER BY c.id DESC LIMIT ? OFFSET ?"
    const rowsParams = [...params, limit, offset]

    const [[{ total }]] = await db.query(countQuery, params)
    const [rows] = await db.query(rowsQuery, rowsParams)

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
}

async function getCustomerById(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    const [rows] = await db.query(
      `SELECT id, name, email, phone, company, address, notes, created_at, updated_at
       FROM customers
       WHERE id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" })
    }

    const summary = await getCustomerSummary(id)

    return res.json({
      ...rows[0],
      ...summary
    })
  } catch (error) {
    return next(error)
  }
}

async function getCustomerLedger(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    const [customers] = await db.query(
      `SELECT id, name, email, phone, company, address, notes, created_at, updated_at
       FROM customers WHERE id = ?`,
      [id]
    )

    if (customers.length === 0) {
      return res.status(404).json({ message: "Customer not found" })
    }

    const [items] = await db.query(
      `
      SELECT id, customer_id, item_name, category, quantity, unit, unit_price, total_amount, notes, created_at
      FROM customer_items
      WHERE customer_id = ?
      ORDER BY created_at DESC, id DESC
      `,
      [id]
    )

    const [payments] = await db.query(
      `
      SELECT id, customer_id, amount, payment_method, notes, created_at
      FROM customer_payments
      WHERE customer_id = ?
      ORDER BY created_at DESC, id DESC
      `,
      [id]
    )

    const [ordersRows] = await db.query(
      `
      SELECT
        o.id,
        o.customer_id,
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
      LEFT JOIN customer_order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = ?
      GROUP BY
        o.id,
        o.customer_id,
        o.product_name,
        o.category,
        o.quantity,
        o.unit_price,
        o.total_amount,
        o.notes,
        o.status,
        o.created_at,
        o.approved_at
      ORDER BY o.created_at DESC, o.id DESC
      `,
      [id]
    )

    const orders = ordersRows.map(mapOrderRow)
    const summary = await getCustomerSummary(id)

    return res.json({
      customer: customers[0],
      summary,
      orders,
      items,
      payments,
      transactions: buildCustomerTransactions({ orders, items, payments })
    })
  } catch (error) {
    return next(error)
  }
}

async function listCustomerItems(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    if (!(await ensureCustomerExists(id))) {
      return res.status(404).json({ message: "Customer not found" })
    }

    const [rows] = await db.query(
      `
      SELECT id, customer_id, item_name, category, quantity, unit, unit_price, total_amount, notes, created_at
      FROM customer_items
      WHERE customer_id = ?
      ORDER BY id DESC
      `,
      [id]
    )

    return res.json(rows)
  } catch (error) {
    return next(error)
  }
}

async function createCustomerItem(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    if (!(await ensureCustomerExists(id))) {
      return res.status(404).json({ message: "Customer not found" })
    }

    const validated = validateItemPayload(req.body)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }

    const { item_name, category, quantity, unit, unit_price, notes } = validated.data
    const totalAmount = Number((quantity * unit_price).toFixed(2))

    const [result] = await db.query(
      `
      INSERT INTO customer_items (customer_id, item_name, category, quantity, unit, unit_price, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [id, item_name, category, quantity, unit, unit_price, totalAmount, notes]
    )

    return res.status(201).json({
      id: result.insertId,
      customer_id: id,
      item_name,
      category,
      quantity,
      unit,
      unit_price,
      total_amount: totalAmount,
      notes
    })
  } catch (error) {
    return next(error)
  }
}

async function deleteCustomerItem(req, res, next) {
  try {
    const customerId = parsePositiveInt(req.params.id, 0)
    const itemId = parsePositiveInt(req.params.itemId, 0)
    if (!customerId || !itemId) {
      return res.status(400).json({ message: "Invalid id" })
    }

    const [result] = await db.query("DELETE FROM customer_items WHERE id = ? AND customer_id = ?", [itemId, customerId])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" })
    }

    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

async function listCustomerPayments(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    if (!(await ensureCustomerExists(id))) {
      return res.status(404).json({ message: "Customer not found" })
    }

    const [rows] = await db.query(
      `
      SELECT id, customer_id, amount, payment_method, notes, created_at
      FROM customer_payments
      WHERE customer_id = ?
      ORDER BY id DESC
      `,
      [id]
    )

    return res.json(rows)
  } catch (error) {
    return next(error)
  }
}

async function createCustomerPayment(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    if (!(await ensureCustomerExists(id))) {
      return res.status(404).json({ message: "Customer not found" })
    }

    const validated = validatePaymentPayload(req.body)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }

    const { amount, payment_method, notes } = validated.data

    const [result] = await db.query(
      `
      INSERT INTO customer_payments (customer_id, amount, payment_method, notes)
      VALUES (?, ?, ?, ?)
      `,
      [id, amount, payment_method, notes]
    )

    return res.status(201).json({
      id: result.insertId,
      customer_id: id,
      amount,
      payment_method,
      notes
    })
  } catch (error) {
    return next(error)
  }
}

async function deleteCustomerPayment(req, res, next) {
  try {
    const customerId = parsePositiveInt(req.params.id, 0)
    const paymentId = parsePositiveInt(req.params.paymentId, 0)
    if (!customerId || !paymentId) {
      return res.status(400).json({ message: "Invalid id" })
    }

    const [result] = await db.query("DELETE FROM customer_payments WHERE id = ? AND customer_id = ?", [paymentId, customerId])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment not found" })
    }

    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

async function createCustomer(req, res, next) {
  try {
    const validated = validateCustomerPayload(req.body)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }

    const { name, email, phone, company, address, notes } = validated.data

    const [result] = await db.query(
      `INSERT INTO customers (name, email, phone, company, address, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, company, address, notes]
    )

    return res.status(201).json({
      id: result.insertId,
      name,
      email,
      phone,
      company,
      address,
      notes
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" })
    }
    return next(error)
  }
}

async function updateCustomer(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    const validated = validateCustomerPayload(req.body)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }

    const { name, email, phone, company, address, notes } = validated.data

    const [result] = await db.query(
      `UPDATE customers
       SET name = ?, email = ?, phone = ?, company = ?, address = ?, notes = ?
       WHERE id = ?`,
      [name, email, phone, company, address, notes, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" })
    }

    return res.json({ id, name, email, phone, company, address, notes })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" })
    }
    return next(error)
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 0)
    if (!id) {
      return res.status(400).json({ message: "Invalid customer id" })
    }

    const [result] = await db.query("DELETE FROM customers WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" })
    }

    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  listCustomers,
  getCustomerById,
  getCustomerLedger,
  listCustomerItems,
  createCustomerItem,
  deleteCustomerItem,
  listCustomerPayments,
  createCustomerPayment,
  deleteCustomerPayment,
  createCustomer,
  updateCustomer,
  deleteCustomer
}
