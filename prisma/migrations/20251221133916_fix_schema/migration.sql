/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Cart` table. All the data in the column will be lost.
  - Made the column `discountBreakdownSnapshot` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reservationExpiresAt` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `attributes` on table `Variant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "updatedAt",
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "discountBreakdownSnapshot" SET NOT NULL,
ALTER COLUMN "reservationExpiresAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Variant" ALTER COLUMN "attributes" SET NOT NULL;
