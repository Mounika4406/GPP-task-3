const express = require("express");
const router = express.Router();
const { getPrice } = require("../controllers/pricing.controller");

router.get(
  "/products/:productId/variants/:variantId/price",
  getPrice
);

module.exports = router;
