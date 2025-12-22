const cartService = require("../services/cart.service");

/* GET CART */
async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

/* ADD ITEM */
async function addItem(req, res, next) {
  try {
    const { variantId, quantity, productId } = req.body;

    if (!variantId || !quantity) {
      return res.status(400).json({ error: "variantId and quantity required" });
    }

    const item = await cartService.addItem({
      userId: req.user.id,
      variantId,
      quantity,
      productId,
      userTier: req.user.tier,
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

/* UPDATE ITEM */
async function updateItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body;

    const item = await cartService.updateItem(id, quantity);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

/* CHECKOUT */
async function checkout(req, res, next) {
  try {
    await cartService.checkout(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  checkout,
};
