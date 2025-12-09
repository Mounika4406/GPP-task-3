const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./db");
const { calculatePrice } = require("./pricingEngine");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Health ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- CATEGORY CRUD ----------
app.post("/categories", async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const category = await prisma.category.create({
      data: { name, parentId: parentId ?? null },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.put("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, parentId } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, parentId: parentId ?? null },
    });
    res.json(category);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

app.delete("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// ---------- PRODUCT CRUD ----------
app.post("/products", async (req, res) => {
  try {
    const { name, description, basePrice, status, categoryId } = req.body;
    const product = await prisma.product.create({
      data: { name, description, basePrice, status, categoryId },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, variants: true },
    });
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.put("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, basePrice, status, categoryId } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, description, basePrice, status, categoryId },
    });
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ---------- VARIANT CRUD ----------
app.post("/variants", async (req, res) => {
  try {
    const { productId, sku, attributes, stockQuantity, priceAdjustment } =
      req.body;
    const variant = await prisma.variant.create({
      data: {
        productId,
        sku,
        attributes: attributes ?? {},
        stockQuantity,
        priceAdjustment,
      },
    });
    res.status(201).json(variant);
  } catch (err) {
    console.error("Error creating variant:", err);
    res.status(500).json({ error: "Failed to create variant" });
  }
});

app.get("/variants", async (req, res) => {
  try {
    const variants = await prisma.variant.findMany({
      include: { product: true },
    });
    res.json(variants);
  } catch (err) {
    console.error("Error fetching variants:", err);
    res.status(500).json({ error: "Failed to fetch variants" });
  }
});

app.put("/variants/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { productId, sku, attributes, stockQuantity, priceAdjustment } =
    req.body;
  try {
    const variant = await prisma.variant.update({
      where: { id },
      data: {
        productId,
        sku,
        attributes: attributes ?? {},
        stockQuantity,
        priceAdjustment,
      },
    });
    res.json(variant);
  } catch (err) {
    console.error("Error updating variant:", err);
    res.status(500).json({ error: "Failed to update variant" });
  }
});

app.delete("/variants/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.variant.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting variant:", err);
    res.status(500).json({ error: "Failed to delete variant" });
  }
});

// ---------- DYNAMIC PRICING ----------
app.get(
  "/products/:productId/variants/:variantId/price",
  async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const variantId = Number(req.params.variantId);
      const quantity = Number(req.query.quantity || 1);
      const userTier = req.query.userTier;
      const promoCode = req.query.promoCode;

      if (!productId || !variantId || quantity <= 0) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const result = await calculatePrice({
        productId,
        variantId,
        quantity,
        userTier,
        promoCode,
      });

      res.json(result);
    } catch (err) {
      console.error("Error calculating price:", err);
      res.status(500).json({ error: "Failed to calculate price" });
    }
  }
);

// ---------- CART ----------
app.post("/cart/items", async (req, res) => {
  const { variantId, quantity } = req.body;
  const userId = null;

  if (!variantId || !quantity || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "variantId and quantity are required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const variants = await tx.$queryRaw`
        SELECT * FROM "Variant"
        WHERE id = ${variantId}
        FOR UPDATE
      `;
      const variant = variants[0];

      if (!variant) throw new Error("VARIANT_NOT_FOUND");

      const available =
        Number(variant.stockquantity ?? variant.stockQuantity) -
        Number(variant.reservedquantity ?? variant.reservedQuantity);

      if (available < quantity) {
        throw new Error("NOT_ENOUGH_STOCK");
      }

      let cart = await tx.cart.findFirst({
        where: { userId, status: "ACTIVE" },
      });
      if (!cart) {
        cart = await tx.cart.create({
          data: { userId, status: "ACTIVE" },
        });
      }

      const pricing = await calculatePrice({
        productId: variant.productid ?? variant.productId,
        variantId,
        quantity,
      });

      const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const item = await tx.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
          priceSnapshotUnit: pricing.unitPrice,
          discountBreakdownSnapshot: pricing.discounts,
          reservationExpiresAt,
        },
      });

      await tx.variant.update({
        where: { id: variantId },
        data: {
          reservedQuantity:
            (variant.reservedquantity ?? variant.reservedQuantity) + quantity,
        },
      });

      return { cartId: cart.id, item, pricing };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Error adding to cart:", err);
    if (err.message === "VARIANT_NOT_FOUND")
      return res.status(404).json({ error: "Variant not found" });
    if (err.message === "NOT_ENOUGH_STOCK")
      return res
        .status(400)
        .json({ error: "Not enough available stock for this variant" });

    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

app.get("/cart", async (req, res) => {
  const userId = null;

  try {
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

    if (!cart) return res.json({ items: [] });

    res.json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Update cart item quantity
app.put("/cart/items/:id", async (req, res) => {
  const cartItemId = Number(req.params.id);
  const { quantity } = req.body;
  const userId = null;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "quantity must be > 0" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { variant: true, cart: true },
      });

      if (!item) throw new Error("ITEM_NOT_FOUND");
      if (item.cart.status !== "ACTIVE") throw new Error("CART_NOT_ACTIVE");
      if (item.cart.userId !== userId) throw new Error("NOT_OWNER");

      const variant = item.variant;
      const diff = quantity - item.quantity;

      if (diff > 0) {
        const available =
          variant.stockQuantity - variant.reservedQuantity;
        if (available < diff) throw new Error("NOT_ENOUGH_STOCK");
        await tx.variant.update({
          where: { id: variant.id },
          data: { reservedQuantity: variant.reservedQuantity + diff },
        });
      } else if (diff < 0) {
        await tx.variant.update({
          where: { id: variant.id },
          data: { reservedQuantity: variant.reservedQuantity + diff },
        });
      }

      const updatedItem = await tx.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });

      return updatedItem;
    });

    res.json(result);
  } catch (err) {
    console.error("Error updating cart item:", err);
    if (err.message === "ITEM_NOT_FOUND")
      return res.status(404).json({ error: "Cart item not found" });
    if (err.message === "CART_NOT_ACTIVE")
      return res.status(400).json({ error: "Cart is not active" });
    if (err.message === "NOT_OWNER")
      return res.status(403).json({ error: "Not your cart" });
    if (err.message === "NOT_ENOUGH_STOCK")
      return res
        .status(400)
        .json({ error: "Not enough stock to increase quantity" });

    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// Delete cart item
app.delete("/cart/items/:id", async (req, res) => {
  const cartItemId = Number(req.params.id);
  const userId = null;

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { variant: true, cart: true },
      });

      if (!item) throw new Error("ITEM_NOT_FOUND");
      if (item.cart.status !== "ACTIVE") throw new Error("CART_NOT_ACTIVE");
      if (item.cart.userId !== userId) throw new Error("NOT_OWNER");

      await tx.variant.update({
        where: { id: item.variantId },
        data: {
          reservedQuantity: item.variant.reservedQuantity - item.quantity,
        },
      });

      await tx.cartItem.delete({ where: { id: cartItemId } });
    });

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting cart item:", err);
    if (err.message === "ITEM_NOT_FOUND")
      return res.status(404).json({ error: "Cart item not found" });
    if (err.message === "CART_NOT_ACTIVE")
      return res.status(400).json({ error: "Cart is not active" });
    if (err.message === "NOT_OWNER")
      return res.status(403).json({ error: "Not your cart" });

    res.status(500).json({ error: "Failed to delete cart item" });
  }
});

// Checkout
app.post("/cart/checkout", async (req, res) => {
  const userId = null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { userId, status: "ACTIVE" },
        include: {
          items: { include: { variant: true } },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("CART_EMPTY");
      }

      let total = 0;

      for (const item of cart.items) {
        const v = item.variant;
        if (!v) throw new Error(`VARIANT_MISSING_${item.variantId}`);

        const qty = item.quantity;

        if (v.reservedQuantity < qty) {
          throw new Error(`NOT_ENOUGH_RESERVED_${item.variantId}`);
        }

        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: { decrement: qty },
            reservedQuantity: { decrement: qty },
          },
        });

        total += qty * Number(item.priceSnapshotUnit);
      }

      const order = await tx.order.create({
        data: { userId, total },
      });

      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.priceSnapshotUnit,
          },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "COMPLETED" },
      });

      return { orderId: order.id, total };
    });

    res.json(result);
  } catch (err) {
    console.error("Error during checkout:", err);
    if (err.message === "CART_EMPTY")
      return res.status(400).json({ error: "Cart is empty" });
    if (err.message.startsWith("NOT_ENOUGH_RESERVED"))
      return res
        .status(400)
        .json({ error: "Not enough reserved stock to checkout" });

    res.status(500).json({ error: "Failed to checkout" });
  }
});

// ----- background cleanup -----
async function releaseExpiredReservations() {
  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const expiredItems = await tx.cartItem.findMany({
        where: {
          reservationExpiresAt: { lt: now },
          cart: { status: "ACTIVE" },
        },
        include: { variant: true },
      });

      for (const item of expiredItems) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            reservedQuantity: { decrement: item.quantity },
          },
        });

        await tx.cartItem.delete({ where: { id: item.id } });
      }
    });
  } catch (err) {
    console.error("Error cleaning expired reservations:", err);
  }
}

setInterval(() => {
  releaseExpiredReservations().catch((err) =>
    console.error("Cleanup interval error:", err)
  );
}, 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
