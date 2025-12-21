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

  // Handle Prisma Decimal -> number safely
  const baseRaw = variant.product.basePrice;
  const adjRaw = variant.priceAdjustment;

  const toNum = (v) =>
    v == null
      ? null
      : typeof v === "number"
      ? v
      : typeof v === "string"
      ? parseFloat(v)
      : typeof v.toNumber === "function"
      ? v.toNumber()
      : Number(v);

  let unitPrice = new Prisma.Decimal(variant.product.basePrice);

if (variant.priceAdjustment) {
  unitPrice = unitPrice.plus(variant.priceAdjustment);
}


  const discounts = [];
  const now = new Date();
 const rules = await prisma.pricingRule.findMany({
  where: { isActive: true },
  orderBy: { priority: "desc" }, // higher priority first
 });

  // Apply rules in hierarchy
// 1. SEASONAL
// 2. USER_TIER
// 3. BULK (ONLY ONE – highest priority)
// 4. PROMO_CODE

let bulkApplied = false;


for (const rule of rules) {
  if (rule.type === "BULK" && bulkApplied) {
    continue; // 🚫 skip other BULK rules
  }

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
      amount: result.discountAmount,
      description: result.description,
    });

    if (rule.type === "BULK") {
      bulkApplied = true; // ✅ stop more BULK discounts
    }
  }
}


  
const finalUnitPrice = unitPrice;
const total = unitPrice.mul(quantity);

return {
  productId,
  variantId,
  quantity,
  unitPrice: finalUnitPrice.toFixed(2),
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
      const start = conditions.startDate ? new Date(conditions.startDate) : null;
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
    default:
      break;
  }

  if (!applicable) return { applied: false };

  let discountAmount = 0;
  let newUnitPrice = currentUnitPrice;

  const discountVal =
    typeof rule.discountValue === "number"
      ? rule.discountValue
      : typeof rule.discountValue === "string"
      ? parseFloat(rule.discountValue)
      : typeof rule.discountValue?.toNumber === "function"
      ? rule.discountValue.toNumber()
      : Number(rule.discountValue);

  if (rule.discountType === "PERCENTAGE") {
   discountAmount = currentUnitPrice.mul(discountVal).div(100);
newUnitPrice = currentUnitPrice.sub(discountAmount);

  } else if (rule.discountType === "FIXED_AMOUNT") {
    discountAmount = discountVal;
    newUnitPrice = currentUnitPrice - discountAmount;
  }

  if (newUnitPrice < 0) newUnitPrice = 0;

  return {
    applied: true,
    newUnitPrice,
    discountAmount,
    description: `Applied ${rule.type} rule (id=${rule.id})`,
  };
}

module.exports = { calculatePrice };
