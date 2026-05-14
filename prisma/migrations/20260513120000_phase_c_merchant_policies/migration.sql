-- CreateEnum
CREATE TYPE "ReturnPolicyCategory" AS ENUM ('FINITE_WINDOW', 'NOT_PERMITTED');

-- CreateEnum
CREATE TYPE "ReturnMethod" AS ENUM ('BY_MAIL', 'IN_STORE', 'PICKUP');

-- CreateEnum
CREATE TYPE "ReturnFees" AS ENUM ('FREE', 'BUYER_PAYS', 'RESTOCKING_FEE');

-- CreateEnum
CREATE TYPE "WarrantyScope" AS ENUM ('LIMITED', 'FULL', 'MANUFACTURER');

-- CreateTable
CREATE TABLE "shipping_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "country_code" TEXT NOT NULL DEFAULT 'BY',
    "region" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BYN',
    "shipping_rate" DOUBLE PRECISION,
    "min_transit_days" INTEGER,
    "max_transit_days" INTEGER,
    "free_shipping_threshold" DOUBLE PRECISION,
    "policy_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "return_policy_category" "ReturnPolicyCategory" NOT NULL DEFAULT 'FINITE_WINDOW',
    "merchant_return_days" INTEGER,
    "return_method" "ReturnMethod" NOT NULL DEFAULT 'BY_MAIL',
    "return_fees" "ReturnFees" NOT NULL DEFAULT 'BUYER_PAYS',
    "policy_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "duration_months" INTEGER,
    "warranty_scope" "WarrantyScope" NOT NULL DEFAULT 'LIMITED',
    "policy_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_policies_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "products"
    ADD COLUMN "shipping_policy_id" TEXT,
    ADD COLUMN "return_policy_id" TEXT,
    ADD COLUMN "warranty_policy_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shipping_policies_code_key" ON "shipping_policies"("code");

-- CreateIndex
CREATE INDEX "shipping_policies_is_active_is_default_idx" ON "shipping_policies"("is_active", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "return_policies_code_key" ON "return_policies"("code");

-- CreateIndex
CREATE INDEX "return_policies_is_active_is_default_idx" ON "return_policies"("is_active", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "warranty_policies_code_key" ON "warranty_policies"("code");

-- CreateIndex
CREATE INDEX "warranty_policies_is_active_is_default_idx" ON "warranty_policies"("is_active", "is_default");

-- CreateIndex
CREATE INDEX "products_shipping_policy_id_idx" ON "products"("shipping_policy_id");

-- CreateIndex
CREATE INDEX "products_return_policy_id_idx" ON "products"("return_policy_id");

-- CreateIndex
CREATE INDEX "products_warranty_policy_id_idx" ON "products"("warranty_policy_id");

-- AddForeignKey
ALTER TABLE "products"
    ADD CONSTRAINT "products_shipping_policy_id_fkey"
    FOREIGN KEY ("shipping_policy_id") REFERENCES "shipping_policies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"
    ADD CONSTRAINT "products_return_policy_id_fkey"
    FOREIGN KEY ("return_policy_id") REFERENCES "return_policies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products"
    ADD CONSTRAINT "products_warranty_policy_id_fkey"
    FOREIGN KEY ("warranty_policy_id") REFERENCES "warranty_policies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
