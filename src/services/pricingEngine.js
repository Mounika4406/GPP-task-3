const prisma = require("./db");

async function calculatePrice(ctx) {
  const { productId, variantId, quantity, userTier, promoCode } = ctx;

  // 🔥 SAFETY CHECK (IMPORTANT)
  if (!variantId) {
    throw new Error("variantId is required for pricing");
  }

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new Error("Variant not found");
  }

  const basePrice = variant.product.basePrice;
  const adjustment = variant.priceAdjustment ?? 0;

  const unitPrice = basePrice + adjustment;

  return {
    unitPrice,
    discounts: [],
    finalUnitPrice: unitPrice,
    totalPrice: unitPrice * quantity,
  };
}

module.exports = { calculatePrice };
