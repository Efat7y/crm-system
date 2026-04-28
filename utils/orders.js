function canIssueInvoice(status) {
  return status === "approved" || status === "completed"
}

function buildInvoiceNumber(orderId, createdAt) {
  const date = createdAt ? new Date(createdAt) : new Date()
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
  return `INV-${year}-${String(orderId).padStart(5, "0")}`
}

function toNumber(value) {
  return Number(value || 0)
}

function parseProductsSummary(value) {
  if (typeof value !== "string") return []
  return value
    .split(" | ")
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapOrderItemRow(row) {
  if (!row) return null

  return {
    ...row,
    quantity: toNumber(row.quantity),
    unit_price: toNumber(row.unit_price),
    total_amount: toNumber(row.total_amount)
  }
}

function mapOrderRow(row) {
  if (!row) return null

  const items = Array.isArray(row.items) ? row.items.map(mapOrderItemRow).filter(Boolean) : []
  const summaryNames = items.length
    ? items.map((item) => item.product_name).filter(Boolean)
    : parseProductsSummary(row.products_summary)
  const fallbackProductName = typeof row.product_name === "string" ? row.product_name.trim() : null
  const productsSummary = summaryNames.length ? summaryNames.join(" | ") : fallbackProductName
  const itemsCount = Number(row.items_count || items.length || (fallbackProductName ? 1 : 0))
  const primaryItem = items[0] || null

  return {
    ...row,
    items,
    items_count: itemsCount,
    products_summary: productsSummary,
    product_name: fallbackProductName || primaryItem?.product_name || null,
    category: row.category || primaryItem?.category || null,
    quantity: toNumber(row.quantity || primaryItem?.quantity),
    unit: row.unit || primaryItem?.unit || null,
    unit_price: toNumber(row.unit_price || primaryItem?.unit_price),
    total_amount: toNumber(row.total_amount),
    invoice_number: buildInvoiceNumber(row.id, row.created_at),
    invoice_ready: canIssueInvoice(row.status),
    has_multiple_items: itemsCount > 1
  }
}

module.exports = {
  canIssueInvoice,
  buildInvoiceNumber,
  mapOrderItemRow,
  parseProductsSummary,
  mapOrderRow
}
