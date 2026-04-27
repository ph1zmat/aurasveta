-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "show_in_header" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "categories_show_in_header_idx" ON "categories"("show_in_header");
