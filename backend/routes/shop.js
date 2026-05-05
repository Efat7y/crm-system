const express = require("express")
const shopController = require("../controllers/shopController")
const { requireAuth, requireRole } = require("../middleware/auth")

const router = express.Router()

router.get("/catalog", shopController.getPublicCatalog)
router.get("/updates", shopController.listUpdates)

router.post("/updates", requireAuth, requireRole("admin"), shopController.createUpdate)
router.delete("/updates/:id", requireAuth, requireRole("admin"), shopController.deleteUpdate)

router.post("/orders", requireAuth, requireRole("customer"), shopController.createOrder)
router.get("/orders/me", requireAuth, requireRole("customer"), shopController.listMyOrders)
router.get("/orders/me/:id", requireAuth, requireRole("customer"), shopController.getMyOrderById)
router.get("/orders/me/:id/invoice", requireAuth, requireRole("customer"), shopController.getMyOrderInvoice)

router.get("/orders", requireAuth, requireRole("admin"), shopController.listAllOrders)
router.get("/orders/:id", requireAuth, requireRole("admin"), shopController.getOrderById)
router.get("/orders/:id/invoice", requireAuth, requireRole("admin"), shopController.getOrderInvoice)
router.put("/orders/:id/status", requireAuth, requireRole("admin"), shopController.updateOrderStatus)

module.exports = router
