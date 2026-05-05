const express = require("express")
const customersController = require("../controllers/customersController")

const router = express.Router()

router.get("/", customersController.listCustomers)
router.get("/:id/ledger", customersController.getCustomerLedger)
router.get("/:id/items", customersController.listCustomerItems)
router.post("/:id/items", customersController.createCustomerItem)
router.delete("/:id/items/:itemId", customersController.deleteCustomerItem)
router.get("/:id/payments", customersController.listCustomerPayments)
router.post("/:id/payments", customersController.createCustomerPayment)
router.delete("/:id/payments/:paymentId", customersController.deleteCustomerPayment)
router.get("/:id", customersController.getCustomerById)
router.post("/", customersController.createCustomer)
router.put("/:id", customersController.updateCustomer)
router.delete("/:id", customersController.deleteCustomer)

module.exports = router
