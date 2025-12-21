const prisma = require("../services/db");
const { calculatePrice } = require("../services/pricingEngine");

/* ======================
   GET CART
====================== */
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    res.json(cart || { items: [] });
  } catch (err) {
    next(err);
  }
};

/* ======================
   ADD ITEM TO CART
====================== */
exports.addItem = async (req, res, next) => {
  try {
    const { variantId, quantity, productId } = req.body;
    const userId = req.user.id;

    if (!variantId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    let cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, status: "ACTIVE" },
      });
    }

    // 🔥 PRICE SNAPSHOT
    const pricing = await calculatePrice({
      productId,
      variantId,
      quantity,
      userTier: req.user.tier,
    });

    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
        priceSnapshotUnit: pricing.unitPrice,
        discountBreakdownSnapshot: pricing.discounts,
        reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      },
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

/* ======================
   UPDATE CART ITEM
====================== */
exports.updateItem = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

/* ======================
   CHECKOUT
====================== */
exports.checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: "COMPLETED" },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
