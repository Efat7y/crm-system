const db = require("../db")

function normalizeText(value) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeCategory(value) {
  const category = normalizeText(value)
  if (!category) return null
  if (category === "raw_material" || category === "fragrance" || category === "color") return category
  return null
}

function parseNonNegativeNumber(value) {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

async function listCatalogItems(req, res, next) {
  try {
    const category = normalizeCategory(req.query.category)
    let query = `
      SELECT id, name, category, default_unit, default_price, notes, created_at
      FROM catalog_items
    `
    const params = []

    if (category) {
      query += " WHERE category = ?"
      params.push(category)
    }

    query += " ORDER BY category ASC, name ASC"
    const [rows] = await db.query(query, params)
    return res.json(rows)
  } catch (error) {
    return next(error)
  }
}

async function getCatalogSections(req, res, next) {
  try {
    const [rows] = await db.query(
      `
      SELECT id, name, category, default_unit, default_price, notes, created_at
      FROM catalog_items
      ORDER BY name ASC
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

async function createCatalogItem(req, res, next) {
  try {
    const name = normalizeText(req.body.name)
    if (!name) {
      return res.status(400).json({ message: "name is required" })
    }

    const category = normalizeCategory(req.body.category)
    if (!category) {
      return res.status(400).json({ message: "category must be raw_material, fragrance or color" })
    }

    const defaultUnit = normalizeText(req.body.default_unit)
    const defaultPrice = parseNonNegativeNumber(req.body.default_price)
    if (defaultPrice === null) {
      return res.status(400).json({ message: "default_price must be zero or greater" })
    }
    const notes = normalizeText(req.body.notes)

    const [result] = await db.query(
      `
      INSERT INTO catalog_items (name, category, default_unit, default_price, notes)
      VALUES (?, ?, ?, ?, ?)
      `,
      [name, category, defaultUnit, defaultPrice, notes]
    )

    return res.status(201).json({
      id: result.insertId,
      name,
      category,
      default_unit: defaultUnit,
      default_price: defaultPrice,
      notes
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This item already exists in the same category" })
    }
    return next(error)
  }
}

async function deleteCatalogItem(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10)
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid catalog item id" })
    }

    const [result] = await db.query("DELETE FROM catalog_items WHERE id = ?", [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Catalog item not found" })
    }

    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

async function updateCatalogItem(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10)
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid catalog item id" })
    }

    const name = normalizeText(req.body.name)
    if (!name) {
      return res.status(400).json({ message: "name is required" })
    }

    const category = normalizeCategory(req.body.category)
    if (!category) {
      return res.status(400).json({ message: "category must be raw_material, fragrance or color" })
    }

    const defaultUnit = normalizeText(req.body.default_unit)
    const defaultPrice = parseNonNegativeNumber(req.body.default_price)
    if (defaultPrice === null) {
      return res.status(400).json({ message: "default_price must be zero or greater" })
    }
    const notes = normalizeText(req.body.notes)

    const [result] = await db.query(
      `
      UPDATE catalog_items
      SET name = ?, category = ?, default_unit = ?, default_price = ?, notes = ?
      WHERE id = ?
      `,
      [name, category, defaultUnit, defaultPrice, notes, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Catalog item not found" })
    }

    return res.json({
      id,
      name,
      category,
      default_unit: defaultUnit,
      default_price: defaultPrice,
      notes
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This item already exists in the same category" })
    }
    return next(error)
  }
}

module.exports = {
  listCatalogItems,
  getCatalogSections,
  createCatalogItem,
  deleteCatalogItem,
  updateCatalogItem
}
