// const { calculatePrice } = require("../pricingEngine");

// exports.getPrice = async (req, res, next) => {
//   try {
//     const productId = Number(req.params.productId);
//     const variantId = Number(req.params.variantId);
//     const quantity = Number(req.query.quantity || 1);

//     if (!productId || !variantId || quantity <= 0) {
//       return res.status(400).json({ error: "Invalid parameters" });
//     }

//     const result = await calculatePrice({
//       productId,
//       variantId,
//       quantity,
//       userTier: req.query.userTier,
//       promoCode: req.query.promoCode,
//     });

//     res.json(result);
//   } catch (err) {
//     next(err);
//   }
// };
const { calculatePrice } = require("../pricingEngine");

exports.getPrice = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const variantId = Number(req.params.variantId);
    const quantity = Number(req.query.quantity || 1);

    const result = await calculatePrice({
      productId,
      variantId,
      quantity,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

