/*
  Warnings:

  - You are about to drop the column `value` on the `product_property_values` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `properties` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[product_id,property_value_id]` on the table `product_property_values` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `property_value_id` to the `product_property_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_property_values_product_id_property_id_key";

-- DropIndex
DROP INDEX "properties_key_key";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "provider_account_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "banner_image" TEXT,
ADD COLUMN     "banner_link" TEXT,
ADD COLUMN     "content_blocks" JSONB,
ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seo" JSONB,
ADD COLUMN     "show_as_banner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "product_property_values" DROP COLUMN "value",
ADD COLUMN     "property_value_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "key",
DROP COLUMN "options",
DROP COLUMN "type",
ADD COLUMN     "hasPhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PropertyType";

-- CreateTable
CREATE TABLE "property_values" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_values_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "section_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "configSchema" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_sections" (
    "id" TEXT NOT NULL,
    "section_type_id" TEXT NOT NULL,
    "title" TEXT,
    "config" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "group" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "property_values_property_id_idx" ON "property_values"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_values_property_id_slug_key" ON "property_values"("property_id", "slug");

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

-- CreateIndex
CREATE UNIQUE INDEX "section_types_name_key" ON "section_types"("name");

-- CreateIndex
CREATE INDEX "home_sections_order_idx" ON "home_sections"("order");

-- CreateIndex
CREATE INDEX "settings_group_idx" ON "settings"("group");

-- CreateIndex
CREATE INDEX "product_property_values_product_id_idx" ON "product_property_values"("product_id");

-- CreateIndex
CREATE INDEX "product_property_values_property_id_idx" ON "product_property_values"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_property_values_product_id_property_value_id_key" ON "product_property_values"("product_id", "property_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- AddForeignKey
ALTER TABLE "property_values" ADD CONSTRAINT "property_values_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_property_values" ADD CONSTRAINT "product_property_values_property_value_id_fkey" FOREIGN KEY ("property_value_id") REFERENCES "property_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_items" ADD CONSTRAINT "compare_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_items" ADD CONSTRAINT "compare_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_sections" ADD CONSTRAINT "home_sections_section_type_id_fkey" FOREIGN KEY ("section_type_id") REFERENCES "section_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
