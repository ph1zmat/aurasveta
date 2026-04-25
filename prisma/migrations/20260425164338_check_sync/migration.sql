/*
  Warnings:

  - You are about to drop the column `hasPhoto` on the `properties` table. All the data in the column will be lost.
  - Made the column `property_value_id` on table `product_property_values` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "product_property_values_product_id_property_id_key";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "provider_account_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "home_sections" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_property_values" ALTER COLUMN "property_value_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "hasPhoto",
ADD COLUMN     "has_photo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "property_values" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "section_types" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "compare_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compare_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_views" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compare_items_user_id_product_id_key" ON "compare_items"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "product_views_user_id_viewed_at_idx" ON "product_views"("user_id", "viewed_at");

-- CreateIndex
CREATE INDEX "product_views_session_id_viewed_at_idx" ON "product_views"("session_id", "viewed_at");

-- CreateIndex
CREATE INDEX "product_views_product_id_viewed_at_idx" ON "product_views"("product_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_views_session_id_product_id_key" ON "product_views"("session_id", "product_id");

-- CreateIndex
CREATE INDEX "search_queries_query_created_at_idx" ON "search_queries"("query", "created_at");

-- AddForeignKey
ALTER TABLE "compare_items" ADD CONSTRAINT "compare_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_items" ADD CONSTRAINT "compare_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
