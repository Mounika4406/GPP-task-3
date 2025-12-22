
const express = require("express");
const router = express.Router();

const {
  getCart,
  addItem,
  updateItem,
  checkout,
} = require("../controllers/cart.controller");

router.get("/cart", getCart);
router.post("/cart/items", addItem);
router.put("/cart/items/:id", updateItem);
router.post("/cart/checkout", checkout);

module.exports = router;
