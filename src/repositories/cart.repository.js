const prisma = require("../services/db");

exports.findActiveCart = (userId) => {
  return prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
    },
  });
};

exports.createCart = (userId) => {
  return prisma.cart.create({
    data: { userId, status: "ACTIVE" },
  });
};

exports.createCartItem = (data) => {
  return prisma.cartItem.create({ data });
};

exports.updateCartItemQuantity = (id, quantity) => {
  return prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });
};
