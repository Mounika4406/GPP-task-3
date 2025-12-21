const express = require("express");
const router = express.Router();


const cartController = require("../controllers/cart.controller");

router.post("/cart/items", cartController.addItem);
router.put("/cart/items/:id", cartController.updateItem);
router.get("/cart", cartController.getCart);
router.post("/cart/checkout", cartController.checkout);

module.exports = router;

