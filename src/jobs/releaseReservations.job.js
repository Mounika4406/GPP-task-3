const prisma = require("../services/db");


module.exports = async function releaseExpiredReservations() {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const expired = await tx.cartItem.findMany({
      where: {
        reservationExpiresAt: { lt: now },
        cart: { status: "ACTIVE" },
      },
      include: { variant: true },
    });

    for (const item of expired) {
      await tx.variant.update({
        where: { id: item.variantId },
        data: {
          reservedQuantity: { decrement: item.quantity },
        },
      });

      await tx.cartItem.delete({ where: { id: item.id } });
    }
  });
};
