/*
  Warnings:

  - Added the required column `accountId` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add columns (idempotent, accountId initially nullable)
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "accountId" TEXT,
ADD COLUMN IF NOT EXISTS "idToken" TEXT,
ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "scope" TEXT;

-- Backfill: set accountId = id for existing rows
UPDATE "accounts" SET "accountId" = "id" WHERE "accountId" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "accounts" ALTER COLUMN "accountId" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_is_active_created_at_idx" ON "products"("is_active", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products"("brand");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications"("identifier");
