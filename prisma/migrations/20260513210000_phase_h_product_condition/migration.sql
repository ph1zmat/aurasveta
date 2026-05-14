-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED');

-- AlterTable
ALTER TABLE "products"
    ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'NEW';
