const db = require("../db")

async function getOverview(req, res, next) {
  try {
    const [summaryRows] = await db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM customers) AS customers_count,
        COALESCE((SELECT SUM(total_amount) FROM customer_items), 0) AS manual_items_total_amount,
        COALESCE((SELECT SUM(total_amount) FROM customer_orders WHERE status IN ('approved', 'completed')), 0) AS approved_orders_total_amount,
        COALESCE((SELECT SUM(total_amount) FROM customer_orders WHERE status = 'pending'), 0) AS pending_orders_total_amount,
        COALESCE((SELECT SUM(amount) FROM customer_payments), 0) AS payments_total_amount,
        (SELECT COUNT(*) FROM customer_items) AS items_count,
        (SELECT COUNT(*) FROM customer_payments) AS payments_count,
        (SELECT COUNT(*) FROM customer_orders) AS orders_count,
        (SELECT COUNT(*) FROM customer_orders WHERE status = 'pending') AS pending_orders_count
      `
    )

    const summary = summaryRows[0] || {}
    const manualItemsTotal = Number(summary.manual_items_total_amount || 0)
    const approvedOrdersTotal = Number(summary.approved_orders_total_amount || 0)
    const pendingOrdersTotal = Number(summary.pending_orders_total_amount || 0)
    const paymentsTotal = Number(summary.payments_total_amount || 0)
    const chargesTotal = Number((manualItemsTotal + approvedOrdersTotal).toFixed(2))

    const [topDebtors] = await db.query(
      `
      SELECT
        c.id,
        c.name,
        (
          COALESCE(i.total_items_amount, 0) +
          COALESCE(o.approved_orders_amount, 0)
        ) AS total_items_amount,
        COALESCE(i.total_items_amount, 0) AS manual_items_amount,
        COALESCE(o.approved_orders_amount, 0) AS approved_orders_amount,
        COALESCE(po.pending_orders_amount, 0) AS pending_orders_amount,
        COALESCE(p.total_paid_amount, 0) AS total_paid_amount,
        GREATEST(
          (
            COALESCE(i.total_items_amount, 0) +
            COALESCE(o.approved_orders_amount, 0)
          ) - COALESCE(p.total_paid_amount, 0),
          0
        ) AS balance_due
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS total_items_amount
        FROM customer_items
        GROUP BY customer_id
      ) i ON i.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS approved_orders_amount
        FROM customer_orders
        WHERE status IN ('approved', 'completed')
        GROUP BY customer_id
      ) o ON o.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS pending_orders_amount
        FROM customer_orders
        WHERE status = 'pending'
        GROUP BY customer_id
      ) po ON po.customer_id = c.id
      LEFT JOIN (
        SELECT customer_id, SUM(amount) AS total_paid_amount
        FROM customer_payments
        GROUP BY customer_id
      ) p ON p.customer_id = c.id
      ORDER BY balance_due DESC, c.id DESC
      LIMIT 5
      `
    )

    const [recentMovements] = await db.query(
      `
      SELECT
        movement_type,
        customer_id,
        customer_name,
        title,
        amount,
        status,
        created_at
      FROM (
        SELECT
          'order' AS movement_type,
          o.customer_id,
          c.name AS customer_name,
          COALESCE(GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ' | '), o.product_name) AS title,
          o.total_amount AS amount,
          o.status,
          o.created_at
        FROM customer_orders o
        INNER JOIN customers c ON c.id = o.customer_id
        LEFT JOIN customer_order_items oi ON oi.order_id = o.id
        GROUP BY o.id, o.customer_id, c.name, o.product_name, o.total_amount, o.status, o.created_at

        UNION ALL

        SELECT
          'item' AS movement_type,
          ci.customer_id,
          c.name AS customer_name,
          ci.item_name AS title,
          ci.total_amount AS amount,
          'recorded' AS status,
          ci.created_at
        FROM customer_items ci
        INNER JOIN customers c ON c.id = ci.customer_id

        UNION ALL

        SELECT
          'payment' AS movement_type,
          cp.customer_id,
          c.name AS customer_name,
          COALESCE(cp.payment_method, 'Payment') AS title,
          cp.amount AS amount,
          'completed' AS status,
          cp.created_at
        FROM customer_payments cp
        INNER JOIN customers c ON c.id = cp.customer_id
      ) movements
      ORDER BY created_at DESC
      LIMIT 10
      `
    )

    return res.json({
      summary: {
        customers_count: Number(summary.customers_count || 0),
        items_total_amount: chargesTotal,
        manual_items_total_amount: manualItemsTotal,
        approved_orders_total_amount: approvedOrdersTotal,
        pending_orders_total_amount: pendingOrdersTotal,
        payments_total_amount: paymentsTotal,
        balance_due_total: Math.max(chargesTotal - paymentsTotal, 0),
        items_count: Number(summary.items_count || 0),
        payments_count: Number(summary.payments_count || 0),
        orders_count: Number(summary.orders_count || 0),
        pending_orders_count: Number(summary.pending_orders_count || 0)
      },
      top_debtors: topDebtors,
      recent_movements: recentMovements
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getOverview
}
