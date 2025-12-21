const prisma = require("./db");
const { Prisma } = require("@prisma/client");

/**
 * ctx = { productId, variantId, quantity, userTier?, promoCode? }
 */
async function calculatePrice(ctx) {
  const { productId, variantId, quantity, userTier, promoCode } = ctx;

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new Error("Variant not found");
  }

  if (variant.productId !== productId) {
    throw new Error(
      `Variant ${variantId} does not belong to product ${productId}`
    );
  }

  // ---------- BASE PRICE (Decimal-safe) ----------
  let unitPrice = new Prisma.Decimal(variant.product.basePrice);

  if (variant.priceAdjustment) {
    unitPrice = unitPrice.plus(new Prisma.Decimal(variant.priceAdjustment));
  }

  const discounts = [];
  const now = new Date();

  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" }, // higher priority first
  });

  // Apply hierarchy:
  // SEASONAL → USER_TIER → BULK (only one) → PROMO_CODE
  let bulkApplied = false;

  for (const rule of rules) {
    if (rule.type === "BULK" && bulkApplied) continue;

    const conditions = rule.conditions || {};

    const result = applyRule({
      rule,
      conditions,
      currentUnitPrice: unitPrice,
      quantity,
      userTier,
      promoCode,
      now,
    });

    if (result.applied) {
      unitPrice = result.newUnitPrice;

      discounts.push({
        type: rule.type,
        amount: result.discountAmount.toNumber(),
        description: result.description,
      });

      if (rule.type === "BULK") {
        bulkApplied = true;
      }
    }
  }

  const total = unitPrice.mul(quantity);

  return {
    productId,
    variantId,
    quantity,
    unitPrice: unitPrice.toFixed(2),
    total: total.toFixed(2),
    discounts,
  };
}

function applyRule({
  rule,
  conditions,
  currentUnitPrice,
  quantity,
  userTier,
  promoCode,
  now,
}) {
  let applicable = false;

  switch (rule.type) {
    case "SEASONAL": {
      const start = conditions.startDate
        ? new Date(conditions.startDate)
        : null;
      const end = conditions.endDate ? new Date(conditions.endDate) : null;

      if ((!start || now >= start) && (!end || now <= end)) {
        applicable = true;
      }
      break;
    }

    case "BULK": {
      const minQty = conditions.minQuantity || 0;
      if (quantity >= minQty) applicable = true;
      break;
    }

    case "USER_TIER": {
      if (conditions.userTier && userTier === conditions.userTier) {
        applicable = true;
      }
      break;
    }

    case "PROMO_CODE": {
      if (conditions.promoCode && promoCode === conditions.promoCode) {
        applicable = true;
      }
      break;
    }
  }

  if (!applicable) return { applied: false };

  let discountAmount = new Prisma.Decimal(0);
  let newUnitPrice = new Prisma.Decimal(currentUnitPrice);
  const discountValue = new Prisma.Decimal(rule.discountValue);

  if (rule.discountType === "PERCENTAGE") {
    discountAmount = newUnitPrice.mul(discountValue).div(100);
    newUnitPrice = newUnitPrice.minus(discountAmount);
  }

  if (rule.discountType === "FIXED_AMOUNT") {
    discountAmount = discountValue;
    newUnitPrice = newUnitPrice.minus(discountAmount);
  }

  if (newUnitPrice.isNegative()) {
    newUnitPrice = new Prisma.Decimal(0);
  }

  return {
    applied: true,
    newUnitPrice,
    discountAmount,
    description: `Applied ${rule.type} rule (id=${rule.id})`,
  };
}

module.exports = { calculatePrice };
