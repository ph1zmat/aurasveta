-- CreateEnum
CREATE TYPE "CategoryMode" AS ENUM ('MANUAL', 'FILTER');

-- CreateEnum
CREATE TYPE "CategoryFilterKind" AS ENUM ('PROPERTY_VALUE', 'SALE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "category_mode" "CategoryMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "filter_kind" "CategoryFilterKind",
ADD COLUMN     "filter_property_id" TEXT,
ADD COLUMN     "filter_property_value_id" TEXT;

-- CreateIndex
CREATE INDEX "categories_category_mode_idx" ON "categories"("category_mode");

-- CreateIndex
CREATE INDEX "categories_filter_kind_idx" ON "categories"("filter_kind");

-- CreateIndex
CREATE INDEX "categories_filter_property_id_idx" ON "categories"("filter_property_id");

-- CreateIndex
CREATE INDEX "categories_filter_property_value_id_idx" ON "categories"("filter_property_value_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_filter_property_id_fkey" FOREIGN KEY ("filter_property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_filter_property_value_id_fkey" FOREIGN KEY ("filter_property_value_id") REFERENCES "property_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
