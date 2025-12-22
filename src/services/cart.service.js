const prisma = require("./db");
const { calculatePrice } = require("./pricingEngine");

/* GET CART */
async function getCart(userId) {
  return prisma.cart.findFirst({
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
}

/* ADD ITEM */
async function addItem({ userId, variantId, quantity, productId, userTier }) {
  let cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId, status: "ACTIVE" },
    });
  }

  const pricing = await calculatePrice({
    productId,
    variantId,
    quantity,
    userTier,
  });

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      variantId,
      quantity,
      priceSnapshotUnit: pricing.unitPrice,
      discountBreakdownSnapshot: pricing.discounts,
      reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
}

/* UPDATE ITEM */
async function updateItem(id, quantity) {
  return prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });
}

/* CHECKOUT */
async function checkout(userId) {
  const cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: "COMPLETED" },
  });

  return true;
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  checkout,
};
