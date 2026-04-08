-- Drop deprecated image_base64 columns after data migration is complete
ALTER TABLE "categories" DROP COLUMN IF EXISTS "image_base64";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "image_base64";
ALTER TABLE "products" DROP COLUMN IF EXISTS "image_base64";
