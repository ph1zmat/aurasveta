-- Add new image path columns (image_base64 kept for data migration)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_original_name" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_path" TEXT;

ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "image_original_name" TEXT;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "image_path" TEXT;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_original_name" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_path" TEXT;
