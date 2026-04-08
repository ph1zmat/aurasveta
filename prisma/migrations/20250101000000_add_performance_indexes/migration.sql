-- Performance indexes for frequently queried columns

-- Products: category filtering
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");

-- Products: active + newest (listing queries)
CREATE INDEX IF NOT EXISTS "products_is_active_created_at_idx" ON "products"("is_active", "created_at" DESC);

-- Products: brand filtering
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products"("brand");

-- Categories: parent navigation
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories"("parent_id");
