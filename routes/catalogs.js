const express = require("express")
const catalogController = require("../controllers/catalogController")

const router = express.Router()

router.get("/", catalogController.listCatalogItems)
router.get("/sections", catalogController.getCatalogSections)
router.post("/", catalogController.createCatalogItem)
router.put("/:id", catalogController.updateCatalogItem)
router.delete("/:id", catalogController.deleteCatalogItem)

module.exports = router
